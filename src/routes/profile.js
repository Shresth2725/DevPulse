const express = require("express");
const { userAuth } = require("../middleware/auth");
const {
  validateProfileEditData,
  validateNewPassword,
} = require("../utils/validation");
const bcrypt = require("bcrypt");

const profileRouter = express.Router();

// GET: view a profile
profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      message: "User accesssed the Profile Successfully",
      data: user,
    });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

// PATCH: edit a profile
profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    if (!validateProfileEditData(req)) {
      throw new Error("Invalid Edit Request");
    }

    const loggedInUser = req.user;

    Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));

    loggedInUser.save();

    res.json({ message: "Profile Updated Successfully", data: loggedInUser });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

// PATCH: edit password
profileRouter.patch("/profile/password", userAuth, async (req, res) => {
  try {
    if (!oldPassword || !newPassword) {
      throw new Error("Both new and old password are required");
    }

    const loggedInUser = req.user;
    const newPassword = req.body.newPassword;
    const oldPassword = req.body.oldPassword;

    const passwordMatch = await bcrypt.compare(
      oldPassword,
      loggedInUser.password
    );
    if (!passwordMatch) {
      throw new Error("Old password is incorrect");
    }

    if (!validateNewPassword(req)) {
      throw new Error("New Password not Strong");
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    loggedInUser.password = hashedNewPassword;
    await loggedInUser.save();

    res.json({
      message: "Password updated successfully",
      data: loggedInUser,
    });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});
module.exports = profileRouter;
