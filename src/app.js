const express = require("express");
const connectDB = require("./config/database");
const User = require("./models/user");
const { validateSignUpData } = require("./utils/validation");
const bcrypt = require("bcrypt");
const validator = require("validator");
const cookieParse = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { userAuth } = require("./middleware/auth");

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

    const isPasswordValid = await user.checkPassword(password);

    if (isPasswordValid) {
      // Creating a JWT
      const token = await user.getJWT();

      // Creating a cookie and storing JWT init
      res.cookie("token", token, {
        expires: new Date(Date.now() + 1 * 3600000),
      });
      res.send("Login successful");
    } else {
      throw new Error("Incorrect password. Please try again.");
    }
  } catch (err) {
    res.status(400).send(`Login failed: ${err.message}`);
  }
});

// GET: profile
app.get("/profile", userAuth, async (req, res) => {
  try {
    const user = req.user;
    console.log("Logged in user is: " + user.firstName);
    res.send("User accesssed the Profile Successfully: " + user);
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

//
app.post("/sendConnectionRequest", userAuth, async (req, res) => {
  console.log("sending connection");
  res.send("connection req sent");
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
