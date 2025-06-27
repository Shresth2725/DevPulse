const express = require("express");
const connectDB = require("./config/database");
const User = require("./models/user");

const app = express();

app.use(express.json());

// POST: dynamic signup api
app.post("/signup", async (req, res) => {
  const user = new User(req.body);

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
