const Airdrop = require("../model/airdrop.model");
const Claim = require("../model/claim.model");
const dotenv = require("dotenv");
dotenv.config();

// Read a single airdrop by ID
const readController = async (req, res) => {
  try {
    const { id } = req.params;
    const airdrop = await Airdrop.findById(id);
    if (!airdrop) {
      return res.status(404).json({ message: "Airdrop not found" });
    }
    res.status(200).json(airdrop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const readbyAddController = async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    const airdrop = await Airdrop.findOne({ tokenAddress });
    if (!airdrop) {
      return res.status(404).json({ message: "Airdrop not found" });
    }
    res.status(200).json(airdrop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a single airdrop by ID
const updateController = async (req, res) => {
  try {
    const { id } = req.params;
    const airdropData = req.body;

    const airdrop = await Airdrop.findByIdAndUpdate(id, airdropData, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });
    res.status(200).json(airdrop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Read all airdrops
const readAllController = async (req, res) => {
  try {
    const airdrops = await Airdrop.find();
    res.status(200).json(airdrops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new airdrop
const createController = async (req, res) => {
  try {
    const airdropData = req.body;

    // Optionally validate airdropData here

    const newAirdrop = new Airdrop(airdropData);
    await newAirdrop.save();
    res.status(201).json(newAirdrop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a claim for an airdrop
const createClaimController = async (req, res) => {
  try {
    const { userAddress, airdropId, amount } = req.body;

    // Validate input
    if (!userAddress || !airdropId || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const airdrop = await Airdrop.findById(airdropId);
    if (!airdrop) {
      return res.status(404).json({ message: "Airdrop not found" });
    }

    const newClaim = new Claim({ userAddress, airdropId, amount });
    await newClaim.save();
    res.status(201).json(newClaim);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get claims by airdrop ID
const getClaimsByAirdropController = async (req, res) => {
  try {
    const { airdropId } = req.params;

    const airdrop = await Airdrop.findById(airdropId);
    if (!airdrop) {
      return res.status(404).json({ message: "Airdrop not found" });
    }

    const claims = await Claim.find({ airdropId });
    res.status(200).json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  readController,
  readbyAddController,
  updateController,
  readAllController,
  createController,
  createClaimController,
  getClaimsByAirdropController,
};
