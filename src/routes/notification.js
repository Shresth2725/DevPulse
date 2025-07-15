const express = require("express");
const { userAuth } = require("../middleware/auth");
const notificationModel = require("../models/notification.js");
const { mongoose } = require("mongoose");

const notificationRouter = express.Router();

notificationRouter.post("/notification/send", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const loggedInUserId = loggedInUser._id;

    const message = req.body.message;
    if (!message || message.length === 0) {
      throw new Error("Empty message");
    }

    const forUserId = req.body.forUserId;
    if (!forUserId || !mongoose.Types.ObjectId.isValid(forUserId)) {
      throw new Error("Invalid user to send");
    }

    if (forUserId === loggedInUserId.toString()) {
      throw new Error("Cannot send notification to yourself");
    }

    const notification = new notificationModel({
      forUserId: forUserId,
      fromUserId: loggedInUserId,
      message: message,
      isSeen: false,
    });

    const data = await notification.save();

    res.json({
      message: "Notification sent sucessfully",
      data: data,
    });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

notificationRouter.get("/notification/receive", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const notifications = await notificationModel.find({
      forUserId: loggedInUser._id,
      isSeen: false,
    });

    res.json({
      message: "All notifications fetch succesfully",
      data: notifications,
    });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

notificationRouter.get(
  "/notification/receive/all",
  userAuth,
  async (req, res) => {
    try {
      const loggedInUser = req.user;

      const notifications = await notificationModel.find({
        forUserId: loggedInUser._id,
      });

      res.json({
        message: "All notifications fetch succesfully",
        data: notifications,
      });
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
    }
  }
);

notificationRouter.patch("/notification/seen", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    await notificationModel.updateMany(
      { forUserId: userId, isSeen: false },
      { $set: { isSeen: true } }
    );

    res.json({
      message: "All notifications marked as seen successfully",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark notifications as seen" });
  }
});

module.exports = notificationRouter;
