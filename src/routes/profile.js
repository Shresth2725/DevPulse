const express = require("express");
const { userAuth } = require("../middleware/auth");
const {
  validateProfileEditData,
  validateNewPassword,
} = require("../utils/validation");
const bcrypt = require("bcrypt");
const User = require("../models/user");

const profileRouter = express.Router();

// GET: view logged in user profile
profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      message: "User accessed the profile successfully",
      data: user,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET: view a profile by ID
profileRouter.get("/profile/viewUser/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "firstName lastName age gender skills about photoUrl"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User fetched successfully",
      data: user,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH: edit logged-in user profile
profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    if (!validateProfileEditData(req)) {
      throw new Error("Invalid edit request data");
    }

    const user = req.user;

    Object.keys(req.body).forEach((key) => {
      if (key in user) user[key] = req.body[key];
    });

    await user.save();

    res.json({
      message: "Profile updated successfully",
      data: user,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH: change password
profileRouter.patch("/profile/password", userAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = req.user;

    if (!oldPassword || !newPassword) {
      throw new Error("Both old and new passwords are required");
    }

    if (oldPassword === newPassword) {
      throw new Error("Old and new passwords cannot be the same");
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new Error("Old password is incorrect");
    }

    if (!validateNewPassword(req)) {
      throw new Error("New password is not strong enough");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({
      message: "Password updated successfully",
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = profileRouter;
