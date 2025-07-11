const express = require("express");
const validator = require("validator");
const User = require("../models/user");
const { validateSignUpData } = require("../utils/validation");
const bcrypt = require("bcrypt");

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

    await user.save();
    res.json({
      message: "User added successfully",
      data: user,
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
      res.json({
        message: "Login successful",
        data: user,
      });
    } else {
      throw new Error("Incorrect password. Please try again.");
    }
  } catch (err) {
    res.status(400).send(`Login failed: ${err.message}`);
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

module.exports = authRouter;
