const express = require("express");

const app = express();

app.get("/user", (req, res) => {
  res.send({ firstname: "Shresth", secondname: "Srivastava" });
});

app.post("/user", (req, res) => {
  res.send("Data sent succesfully");
});

app.use("/test", (req, res) => {
  res.send("hello from test");
});

app.listen(7777, () => {
  console.log("server");
});
