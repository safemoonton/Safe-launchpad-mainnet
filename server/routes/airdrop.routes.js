const express = require("express");
const router = express.Router();

const {
  readController,
  readbyAddController,
  updateController,
  readAllController,
  createController,
  createClaimController,
  getClaimsByAirdropController,
} = require("../controllers/airdrop.controller");

router.get("/airdrop/:id", readController);
router.get("/airdrop/token/:tokenAddress", readbyAddController);
router.put("/airdrop/:id", updateController);
router.get("/airdrop/all", readAllController);
router.post("/airdrop", createController);
// Purchase routes
router.post("/claims", createClaimController);
router.get("/claims/:airdropId", getClaimsByAirdropController);

module.exports = router;
