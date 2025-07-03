const express = require("express");
const { userAuth } = require("../middleware/auth");

const profileRouter = express.Router();

// GET: profile
profileRouter.get("/profile", userAuth, async (req, res) => {
  try {
    const user = req.user;
    console.log("Logged in user is: " + user.firstName);
    res.send("User accesssed the Profile Successfully: " + user);
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

module.exports = profileRouter;
