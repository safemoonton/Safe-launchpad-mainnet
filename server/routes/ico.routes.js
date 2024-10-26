const express = require("express");
const router = express.Router();

const {
  readController,
  updateController,
  readAllController,
  createController,
  createPurchaseController,
  updatePurchaseController,
  readAllWithContributionsController,
  getPurchasesByICOController,
} = require("../controllers/ico.controller");

router.get("/launchpad/:id", readController);
router.put("/launchpad/:id", updateController);
router.get("/all-launchpad", readAllWithContributionsController);
router.post("/launchpad", createController);
// Purchase routes
router.post("/purchases", createPurchaseController);
router.put("/purchases/:purchaseId", updatePurchaseController);
router.get("/purchases/:icoId", getPurchasesByICOController);

module.exports = router;
