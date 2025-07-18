const express = require("express");
const { userAuth } = require("../middleware/auth");
const connectionRequestModel = require("../models/connectionRequest");
const User = require("../models/user");

const requestRouter = express.Router();

// POST: send request for connection
requestRouter.post(
  "/request/send/:status/:toUserId",
  userAuth,
  async (req, res) => {
    try {
      const fromUserId = req.user._id;
      const toUserId = req.params.toUserId;
      const status = req.params.status;

      // check if status is of valid type or not
      const allowedStatus = ["ignored", "interested"];
      if (!allowedStatus.includes(status)) {
        throw new Error("Status not allowed in this API");
      }

      // check if both the Ids are same or not
      if (fromUserId === toUserId) {
        throw new Error("Both Ids are same");
      }

      // Check if toUserId exist in DB or not
      const toUser = await User.findOne({ _id: toUserId });
      if (!toUser) {
        throw new Error(`User ID ${toUserId} does not exist`);
      }

      // Check if connection request has already been sent or not
      const getEarlierConnectionrequest = await connectionRequestModel.findOne({
        $or: [
          { fromUserId: fromUserId, toUserId: toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });

      if (getEarlierConnectionrequest) {
        throw new Error("Connection request has already been sent");
      }

      const connectionRequest = new connectionRequestModel({
        fromUserId,
        toUserId,
        status,
      });

      const data = await connectionRequest.save();
      res.json({
        message:
          req.user.firstName + " is " + status + " in " + toUser.firstName,
        data,
      });
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
    }
  }
);

// POST: review the request for connection
requestRouter.post(
  "/request/review/:status/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const loggedInUser = req.user;
      const status = req.params.status;
      const requestId = req.params.requestId;

      const allowedStatus = ["accepted", "rejected"];
      if (!allowedStatus.includes(status)) {
        throw new Error("Status not allowed");
      }

      const connectionRequest = await connectionRequestModel.findOne({
        fromUserId: requestId,
        toUserId: loggedInUser._id,
        status: "interested",
      });
      if (!connectionRequest) {
        throw new Error("No such connection request exist");
      }

      connectionRequest.status = status;
      await connectionRequest.save();

      res.json({
        message: "Connection Request Accepted",
        data: connectionRequest,
      });
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
    }
  }
);

// POST: remove request
requestRouter.post("/request/unsend/:id", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const requestSentToUserId = req.params.id;

    await connectionRequestModel.deleteOne({
      fromUserId: loggedInUser._id,
      toUserId: requestSentToUserId,
      status: "interested",
    });

    res.json({ message: "Connection request removed" });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

module.exports = requestRouter;
