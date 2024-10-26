const express = require("express");
const router = express.Router();

const {
  readController,
  updateController,
  readAllController,
  createController,
  readAllByTokenController,
} = require("../controllers/lock.controller");

router.get("/lock/:lockAddress", readController);
router.get("/lock/token/:tokenAddress", readAllByTokenController);
router.put("/lock/:id", updateController);
router.get("/lock/all", readAllController);
router.post("/lock", createController);

module.exports = router;
