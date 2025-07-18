const express = require("express");
const connectDB = require("./config/database");
const cookieParse = require("cookie-parser");
const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParse());

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

// connect to DB and start server
connectDB()
  .then(() => {
    console.log("DB connected");
    app.listen(7777, () => {
      console.log("Server started on port 7777");
    });
  })
  .catch((err) => {
    console.error(`Failed to connect to database: ${err.message}`);
  });
