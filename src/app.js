const express = require("express");
const connectDB = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");

require("dotenv").config();

const app = express();

// CORS setup to allow cookies
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Routes
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");
const notificationRouter = require("./routes/notification");

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", notificationRouter);

// DB connection and server start
connectDB()
  .then(() => {
    console.log("DB connected");
    app.listen(process.env.PORT, () => {
      console.log("Server started on port 7777");
    });
  })
  .catch((err) => {
    console.error(`Failed to connect to database: ${err.message}`);
  });
