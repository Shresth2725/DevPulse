const express = require("express");
const connectDB = require("./config/database");
const User = require("./models/user");

const app = express();

app.post("/signup", async (req, res) => {
  const userObj = {
    firstName: "Virat",
    lastName: "Kohli",
    emailId: "Kohli@gmail.com",
    password: "123256789",
  };

  const user = new User(userObj);

  try {
    await user.save();
    res.send("User add succesfully");
  } catch (err) {
    res.status(400).send("Error saving the user: " + err.message);
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
