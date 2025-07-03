const express = require("express");
const { userAuth } = require("../middleware/auth");

const requestRouter = express.Router();

// POST: send request for connection
requestRouter.post("/sendConnectionRequest", userAuth, async (req, res) => {
  console.log("sending connection");
  res.send("connection req sent");
});

module.exports = requestRouter;
