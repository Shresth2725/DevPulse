const express = require("express");
const { userAuth } = require("../middleware/auth");
const connectionRequestModel = require("../models/connectionRequest");
const User = require("../models/user");

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

// GET: fetch feed for user
userRouter.get("/feed?page=1&limit=10", userAuth, async (req, res) => {
  try {
    // User should see all user except
    // 0. his own card
    // 1. his connection
    // 2. ignored people
    // 3. whom already interested in

    const loggedInUser = req.user;

    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    const connectionRequest = await connectionRequestModel
      .find({
        $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
      })
      .select("fromUserId toUserId");

    const hideUsersFromFeed = new Set();
    connectionRequest.forEach((user) => {
      hideUsersFromFeed.add(user.fromUserId.toString());
      hideUsersFromFeed.add(user.toUserId.toString());
    });

    const users = await User.find({
      $and: [
        { _id: { $nin: Array.from(hideUsersFromFeed) } },
        { _id: { $ne: loggedInUser._id } },
      ],
    })
      .select("firstName , lastName , age , skill , about ,gender , photoURL")
      .skip(skip)
      .limit(limit);

    if (!users) {
      throw new Error("No user left");
    }

    res.send(users);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = userRouter;
