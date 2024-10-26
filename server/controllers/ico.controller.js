const ICO = require("../model/ico.model");
const Purchase = require("../model/purchase.model");
const dotenv = require("dotenv");
dotenv.config();

// Read controller - To read the data of a single ICO by id
const readController = async (req, res) => {
  try {
    const { id } = req.params;
    const ico = await ICO.findOne({ _id: id });
    if (!ico) {
      return res.status(404).json({ message: "ICO not found" });
    }
    res.status(200).json(ico);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update controller - To update an existing ICO data by ID, if not found create it
const updateController = async (req, res) => {
  try {
    const { id } = req.params;
    const icoData = req.body;
    let ico = await ICO.findOneAndUpdate({ _id: id }, icoData, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });
    res.status(200).json(ico);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Read All controller - To read the data of all ICOs
const readAllController = async (req, res) => {
  try {
    const icos = await ICO.find();
    res.status(200).json(icos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Read All controller with total contributions for each ICO
const readAllWithContributionsController = async (req, res) => {
  try {
    const icos = await ICO.find();

    // Adding total contributions to each ICO
    const icosWithContributions = await Promise.all(
      icos.map(async (ico) => {
        console.log("ICO>>>", ico);
        const purchases = await Purchase.find({ icoId: ico._id });
        const totalContributions = purchases.reduce(
          (sum, purchase) => Number(sum) + Number(purchase.amount),
          0
        );
        return {
          ...ico.toObject(),
          totalContributions,
        };
      })
    );

    res.status(200).json(icosWithContributions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create controller - To create a new ICO entry
const createController = async (req, res) => {
  try {
    const icoData = req.body;
    const newICO = new ICO(icoData);
    await newICO.save();
    res.status(201).json(newICO);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPurchaseController = async (req, res) => {
  try {
    const { userId, icoId, amount } = req.body;

    // Ensure the ICO exists
    const ico = await ICO.findById(icoId);
    if (!ico) {
      return res.status(404).json({ message: "ICO not found" });
    }

    const newPurchase = new Purchase({
      userId,
      icoId,
      amount,
    });

    await newPurchase.save();
    res.status(201).json(newPurchase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePurchaseController = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const { isClaimed } = req.body;

    // Ensure the Purchase exists
    let purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // Update the purchase details
    purchase.isClaimed = isClaimed;

    await purchase.save();
    res.status(200).json(purchase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPurchasesByICOController = async (req, res) => {
  try {
    const { icoId } = req.params;

    // Ensure the ICO exists
    const ico = await ICO.findById(icoId);
    if (!ico) {
      return res.status(404).json({ message: "ICO not found" });
    }

    const purchases = await Purchase.find({ icoId });
    res.status(200).json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  readController,
  updateController,
  readAllController,
  createController,
  createPurchaseController,
  updatePurchaseController,
  readAllWithContributionsController,
  getPurchasesByICOController,
};
