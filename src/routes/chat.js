const express = require("express");
const { Chat } = require("../models/chat");
const { userAuth } = require("../middleware/auth");

const chatRouter = express.Router();

chatRouter.get("/chat/:targetUserId", userAuth, async (req, res) => {
  const { targetUserId } = req.params;
  const userId = req.user._id;
  try {
    let chat = await Chat.findOne({
      participants: { $all: [userId, targetUserId] },
    }).populate({
      path: "messages.senderId",
      select: "firstName lastName",
      //   options: {
      //     sort: { createdAt: -1 }, // Newest first
      //     limit: 100, // Limit to last 100
      //   },
    });
    if (!chat) {
      chat = new Chat({
        participants: [userId, targetUserId],
        message: [],
      });
      await chat.save();
    }

    res.json({
      message: "Chat fetched successfully",
      data: chat,
    });
  } catch (err) {
    console.log(err.message);
  }
});

module.exports = chatRouter;
