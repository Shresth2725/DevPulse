const express = require("express");
const connectDB = require("./config/database");
const User = require("./models/user");
const { validateSignUpData } = require("./utils/validation");
const bcrypt = require("bcrypt");
const validator = require("validator");
const cookieParse = require("cookie-parser");
const jwt = require("jsonwebtoken");

const app = express();

app.use(express.json());
app.use(cookieParse());

// POST: signup
app.post("/signup", async (req, res) => {
  try {
    validateSignUpData(req);

    req.body.firstName = req.body?.firstName?.trim();
    req.body.lastName = req.body?.lastName?.trim();
    req.body.emailId = req.body?.emailId?.toLowerCase().trim();

    const { firstName, lastName, emailId, password } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
    });

    await user.save();
    res.send("User added successfully");
  } catch (err) {
    res.status(400).send(`Signup failed: ${err.message}`);
  }
});

// POST: login
app.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!validator.isEmail(emailId)) {
      throw new Error("Invalid email address.");
    }

    const user = await User.findOne({ emailId });
    if (!user) {
      return res.status(404).send("No user found with the provided email.");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid) {
      // Creating a JWT
      const token = await jwt.sign({ _id: user.id }, "DEV@Pulse$1510");

      // Creating a cookie and storing JWT init
      res.cookie("token", token);
      res.send("Login successful");
    } else {
      throw new Error("Incorrect password. Please try again.");
    }
  } catch (err) {
    res.status(400).send(`Login failed: ${err.message}`);
  }
});

// GET: profile
app.get("/profile", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) throw new Error("Invalid Token");

    const decodedMessage = await jwt.verify(token, "DEV@Pulse$1510");
    const { _id } = decodedMessage;

    const user = await User.findById(_id);
    if (!user) throw new Error("User does not exist");

    console.log("Logged in user is: " + user.firstName);
    res.send("User accesssed the Profile Successfully: " + user);
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

// GET: get user by email
app.get("/user", async (req, res) => {
  try {
    const userEmail = req.body.emailId;
    const users = await User.find({ emailId: userEmail });

    if (users.length === 0) {
      return res.status(404).send("No user found with the specified email.");
    }

    res.send(users);
  } catch (err) {
    res.status(400).send(`Unable to fetch user: ${err.message}`);
  }
});

// GET: get all users
app.get("/feed", async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (err) {
    res.status(400).send(`Unable to fetch users: ${err.message}`);
  }
});

// DELETE: delete a user by ID
app.delete("/user", async (req, res) => {
  try {
    const userId = req.body.userId;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).send("No user found with the specified ID.");
    }

    res.send("User deleted successfully");
  } catch (err) {
    res.status(400).send(`Unable to delete user: ${err.message}`);
  }
});

// PATCH: update a user by ID
app.patch("/user/:userId", async (req, res) => {
  try {
    const data = req.body;
    const userId = req.params.userId;

    const ALLOWED_UPDATES = ["photoURL", "about", "gender", "age", "skills"];
    const isUpdateAllowed = Object.keys(data).every((k) =>
      ALLOWED_UPDATES.includes(k)
    );

    if (!isUpdateAllowed) {
      throw new Error(
        `Update not allowed. Allowed fields: ${ALLOWED_UPDATES.join(", ")}`
      );
    }

    const user = await User.findByIdAndUpdate(userId, data, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!user) {
      return res.status(404).send("No user found with the specified ID.");
    }

    res.send("User updated successfully");
  } catch (err) {
    res.status(400).send(`Unable to update user: ${err.message}`);
  }
});

// PATCH: update a user by emailId
app.patch("/userByEmail", async (req, res) => {
  try {
    const data = req.body;
    const userEmailId = req.body.emailId;

    const user = await User.updateOne({ emailId: userEmailId }, data);

    if (user.matchedCount === 0) {
      return res.status(404).send("No user found with the specified email.");
    }

    res.send("User updated successfully");
  } catch (err) {
    res.status(400).send(`Unable to update user: ${err.message}`);
  }
});

// connect to DB and start server
connectDB()
  .then(() => {
    console.log("DB connected");
    app.listen(7777, () => {
      console.log("Server started on port 7777");
    });
  })
  .catch((err) => {
    console.error(`Failed to connect to database: ${err.message}`);
  });
