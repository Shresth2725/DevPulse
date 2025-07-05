const express = require("express");
const { userAuth } = require("../middleware/auth");
const connectionRequestModel = require("../models/connectionRequest");

const userRouter = express.Router();

// GET: fetch all the connection
userRouter.get("/user/connection", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connections = await connectionRequestModel
      .find({
        $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
        status: "accepted",
      })
      .populate(
        "fromUserId",
        "firstName lastName age skill about gender photoURL"
      )
      .populate(
        "toUserId",
        "firstName lastName age skill about gender photoURL"
      );

    const connectedUsers = connections.map((conn) => {
      let connectedUser;
      if (conn.fromUserId._id.equals(loggedInUser._id)) {
        connectedUser = conn.toUserId;
      } else {
        connectedUser = conn.fromUserId;
      }
      return {
        _id: connectedUser?._id,
        firstName: connectedUser?.firstName || "",
        lastName: connectedUser?.lastName || "",
        age: connectedUser?.age || null,
        skill: connectedUser?.skill || [],
        about: connectedUser?.about || "",
        gender: connectedUser?.gender || "",
        photoURL: connectedUser?.photoURL || "",
      };
    });

    res.json({
      message: "Connections fetched successfully",
      data: connectedUsers,
    });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

// GET: fetch all the connection request
userRouter.get("/user/request/received", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const getConnectionRequests = await connectionRequestModel
      .find({
        toUserId: loggedInUser._id,
        status: "interested",
      })
      .populate(
        "fromUserId",
        "firstName , lastName , age , skill , about ,gender , photoURL"
      );

    if (!getConnectionRequests) {
      throw new Error("No Connection Request");
    }

    res.json({
      message: `Connection Request for ${loggedInUser.firstName}`,
      data: getConnectionRequests,
    });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

module.exports = userRouter;
