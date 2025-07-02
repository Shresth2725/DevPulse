const jwt = require("jsonwebtoken");
const User = require("../models/user");

const userAuth = async (req, res, next) => {
  try {
    // read the token from req
    const { token } = req.cookies;
    if (!token) throw new Error("Token is not valid!!!");

    //   verify the token
    const decodedMessage = await jwt.verify(token, "DEV@Pulse$1510");
    const { _id } = decodedMessage;
    const user = await User.findById(_id);

    if (!user) {
      throw new Error("User not found");
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
};

module.exports = {
  userAuth,
};
