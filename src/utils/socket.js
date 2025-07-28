const socket = require("socket.io");
const { Chat } = require("../models/chat");
const connectionRequestModel = require("../models/connectionRequest");

const intializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("joinChat", ({ targetUserId, userId }) => {
      const roomId = [userId, targetUserId].sort().join("_");
      socket.join(roomId);
      console.log(`User ${userId} joined room ${roomId}`);
    });

    socket.on(
      "sendMessage",
      async ({ userId, targetUserId, text, firstName }) => {
        const roomId = [userId, targetUserId].sort().join("_");

        try {
          // check if userId and TargerUserId are friends or not
          const getEarlierConnectionrequest =
            await connectionRequestModel.findOne({
              $or: [
                {
                  fromUserId: userId,
                  toUserId: targetUserId,
                  status: "accepted",
                },
                {
                  fromUserId: targetUserId,
                  toUserId: userId,
                  status: "accepted",
                },
              ],
            });
          if (!getEarlierConnectionrequest) {
            throw new Error("Targetted user is not your friend");
          }

          // Find or create chat
          let chat = await Chat.findOne({
            participants: { $all: [userId, targetUserId] },
          });

          if (!chat) {
            chat = new Chat({
              participants: [userId, targetUserId],
              messages: [],
            });
          }

          // Push message
          chat.messages.push({
            senderId: userId,
            text,
          });

          // Save to DB
          await chat.save();
        } catch (err) {
          console.log("Error saving message:", err.message);
        }

        // Emit to room
        io.to(roomId).emit("messageReceived", { text, firstName });
      }
    );

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });
};

module.exports = intializeSocket;
