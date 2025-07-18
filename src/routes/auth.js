const express = require("express");
const validator = require("validator");
const User = require("../models/user");
const { validateSignUpData } = require("../utils/validation");
const bcrypt = require("bcrypt");
const { userAuth } = require("../middleware/auth");
const notificationModel = require("../models/notification.js");

const connectionRequestModel = require("../models/connectionRequest");

const authRouter = express.Router();

// POST: signup
authRouter.post("/signup", async (req, res) => {
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

    const savedUser = await user.save();

    // Creating a JWT
    const token = await savedUser.getJWT();

    // Creating a cookie and storing JWT init
    res.cookie("token", token, {
      expires: new Date(Date.now() + 1 * 3600000),
    });

    res.json({
      message: "User added successfully",
      data: savedUser,
    });
  } catch (err) {
    res.status(400).send(`Signup failed: ${err.message}`);
  }
});

// POST: login
authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!validator.isEmail(emailId)) {
      throw new Error("Invalid credentials.");
    }

    const user = await User.findOne({ emailId });
    if (!user) {
      return res
        .status(404)
        .send("No user found with the provided credentials.");
    }

    const isPasswordValid = await user.checkPassword(password);

    if (isPasswordValid) {
      // Creating a JWT
      const token = await user.getJWT();

      // Creating a cookie and storing JWT init
      res.cookie("token", token, {
        expires: new Date(Date.now() + 1 * 3600000),
      });
      res.json({
        message: "Login successful",
        data: user,
      });
    } else {
      throw new Error("Incorrect credentials. Please try again.");
    }
  } catch (err) {
    res.status(400).send(`ERROR: ${err.message}`);
  }
});

// POST: logout
authRouter.post("/logout", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      throw new Error("No Token found");
    }

    res.cookie("token", null, {
      expires: new Date(Date.now()),
    });

    res.json({
      message: "User Logged Out",
    });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

// POST: delete a user
authRouter.post("/deleteUser", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const loggedInUserId = loggedInUser._id;

    // Delete all its notifcations
    await notificationModel.deleteMany({
      $or: [{ forUserId: loggedInUserId }, { fromUserId: loggedInUserId }],
    });

    // Delete all its connections
    await connectionRequestModel.deleteMany({
      $or: [{ fromUserId: loggedInUserId }, { toUserId: loggedInUserId }],
    });

    // Delete User
    await User.deleteOne({ _id: loggedInUserId });

    res.json({ message: "User delete successfully" });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

module.exports = authRouter;
