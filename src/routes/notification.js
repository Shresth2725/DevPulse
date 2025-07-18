const express = require("express");
const { userAuth } = require("../middleware/auth");
const notificationModel = require("../models/notification.js");
const { mongoose } = require("mongoose");

const notificationRouter = express.Router();

// POST: send notification
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

// GET: get unseen notification
notificationRouter.get("/notification/receive", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const notifications = await notificationModel
      .find({
        forUserId: loggedInUser._id,
        isSeen: false,
      })
      .populate(
        "fromUserId",
        "firstName lastName age skills about gender photoUrl"
      );

    res.json({
      message: "All notifications fetch succesfully",
      data: notifications,
    });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

// GET: get all notification history
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

// PATCH: to make notification as seen
notificationRouter.patch("/notification/seen", userAuth, async (req, res) => {
  try {
    // const userId = req.user._id;
    const id = req.body.id;

    await notificationModel.updateMany({ _id: id }, { $set: { isSeen: true } });

    res.json({
      message: "All notifications marked as seen successfully",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark notifications as seen" });
  }
});

module.exports = notificationRouter;
