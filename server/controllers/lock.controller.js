const TokenLock = require("../model/lock.model");

const createController = async (req, res) => {
  try {
    const tokenLock = new TokenLock(req.body);
    await tokenLock.save();
    res.status(201).json(tokenLock);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const readController = async (req, res) => {
  try {
    const { lockAddress } = req.params;
    const tokenLock = await TokenLock.findOne({ lockAddress });
    if (!tokenLock) {
      return res.status(404).json({ message: "Token Lock not found" });
    }
    res.status(200).json(tokenLock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const readAllByTokenController = async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    const tokenLock = await TokenLock.find({ tokenAddress });
    if (!tokenLock) {
      return res.status(404).json({ message: "Token Lock not found" });
    }
    res.status(200).json(tokenLock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const readAllController = async (req, res) => {
  try {
    const tokenLocks = await TokenLock.find();
    res.status(200).json(tokenLocks);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateController = async (req, res) => {
  const { id } = req.params;
  const { claimed } = req.body;

  try {
    const tokenLock = await TokenLock.findById(id);

    if (!tokenLock) {
      return res.status(404).json({ error: "Token lock not found" });
    }

    tokenLock.claimed = claimed;
    await tokenLock.save();

    res.status(200).json(tokenLock);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  readController,
  updateController,
  readAllController,
  createController,
  readAllByTokenController,
};
