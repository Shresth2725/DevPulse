const { mongoose, model } = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    forUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    isSeen: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
