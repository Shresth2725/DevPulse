const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(
    "mongodb+srv://namasteDev:90MXrGdntSw0cdcM@dummydb.lcycvcb.mongodb.net/devPulse"
  );
};

module.exports = connectDB;
