const express = require("express");
const connectDB = require("./config/database");
const User = require("./models/user");

const app = express();

app.use(express.json());

// POST: dynamic signup api
app.post("/signup", async (req, res) => {
  const user = new User(req.body);
  req.body.firstName = req.body?.firstName?.trim();
  req.body.lastName = req.body?.lastName?.trim();
  req.body.about = req.body?.about?.trim();
  req.body.emailId = req.body?.emailId?.toLowerCase().trim();
  try {
    await user.save();
    res.send("User add succesfully");
  } catch (err) {
    res.status(400).send("Error saving the user: " + err.message);
  }
});

// GET: get user by email
app.get("/user", async (req, res) => {
  const userEmail = req.body.emailId;
  try {
    const users = await User.find({ emailId: userEmail });
    if (users.length === 0) {
      res.status(404).send("user not found");
    }
    res.send(users);
  } catch (err) {
    res.status(400).send("Something went wrong!");
  }
});

// GET: get all user data api(profile)
app.get("/feed", async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (err) {
    res.status(400).send("Something went wrong");
  }
});

// DELETE: delete a user by its id
app.delete("/user", async (req, res) => {
  const userId = req.body.userId;

  try {
    // const user = await User.findByIdAndDelete( { _id: userId} ) ;
    const user = await User.findByIdAndDelete(userId);
    if (!user) res.status(404).send("user not found");
    else res.send("user deleted successfully");
  } catch (err) {
    res.status(400).send("Something went wrong");
  }
});

// PATCH: update a user by id
app.patch("/user/:userId", async (req, res) => {
  try {
    const data = req.body;
    const userId = req.params.userId;

    const ALLOWED_UPDATES = ["photoURL", "about", "gender", "age", "skills"];

    const isUpdateAllowed = Object.keys(data).every((k) =>
      ALLOWED_UPDATES.includes(k)
    );

    if (!isUpdateAllowed) {
      throw new Error("Update not allowed");
    }

    const user = await User.findByIdAndUpdate({ _id: userId }, data, {
      returnDocument: "after",
      runValidators: true,
    });
    console.log(user);

    if (!user) res.status(404).send("User not found");
    else res.send("user updated succesfully");
  } catch (err) {
    res.status(400).send("Something went wrong: " + err.message);
  }
});

// PATCH: update a user by emailid
app.patch("/userByEmail", async (req, res) => {
  try {
    const data = req.body;
    const userEmailId = req.body.emailId;

    const user = await User.updateOne({ emailId: userEmailId }, data);
    if (!user) res.status(404).send("User not found");
    else res.send("User updated successfully");
  } catch (err) {
    res.status(400).send("Something went wrong");
  }
});

connectDB()
  .then(() => {
    console.log("DB connected");
    app.listen(7777, () => {
      console.log("Server opened");
    });
  })
  .catch((err) => {
    console.error(err.message);
  });
