const jwt = require("jsonwebtoken");
const User = require("../models/user");

const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) throw new Error("Token is not valid!!!");

    const decodedMessage = jwt.verify(token, "DEV@Pulse$1510");
    const user = await User.findById(decodedMessage._id);
    if (!user) throw new Error("User not found");

    req.user = user;
    next();
  } catch (err) {
    res.status(400).json({ message: "Auth Error: " + err.message });
  }
};

module.exports = { userAuth };
