require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const connection = require("./db");
const ICO = require("./model/ico.model");
const Airdrop = require("./model/airdrop.model");
const TokenLock = require("./model/lock.model");


//database connection
connection();

//middlewares
app.use(express.json());
app.use(cors());

//Load all routes
const icoRouter = require("./routes/ico.routes");
const airdropRouter = require("./routes/airdrop.routes");
const lockRouter = require("./routes/lock.routes");

//routes
app.get("/", (req, res) => res.json("Server is live"));
app.use("/api/v1", icoRouter);
app.use("/api/v1", airdropRouter);
app.use("/api/v1", lockRouter);
app.get("/api/v1/all-launch", async (req, res) => {
  const allLaunch = await ICO.find();
  res.json(allLaunch);
});
app.get("/api/v1/all-airdrop", async (req, res) => {
  const allAirdrop = await Airdrop.find();
  res.json(allAirdrop);
});
app.get("/api/v1/all-lock", async (req, res) => {
  const allLock = await TokenLock.find();
  res.json(allLock);
});

const port = process.env.PORT || 8080;
app.listen(port, () =>
  console.log(`Server is running on localhost PORT: ${port}`)
);

module.exports = app;
