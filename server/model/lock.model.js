const mongoose = require("mongoose");

const TokenLockSchema = new mongoose.Schema(
  {
    tokenAddress: { type: String, required: true },
    ownerAddress: { type: String, required: true },
    lockAddress: { type: String, required: true },
    creatorAddress: { type: String, required: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    tokenInfo: {
      name: {
        type: String,
      },
      symbol: {
        type: String,
      },
      decimals: {
        type: String,
      },
      description: {
        type: String,
      },
      logo: {
        type: String,
      },
      admin_address: {
        type: String,
      },
      contract_address: {
        type: String,
      },
      total_supply: {
        type: String,
      },
      user_balance: {
        type: String,
      },
      user_jetton_address: {
        type: String,
      },
    },
    useVestingPeriod: { type: Boolean, deafult: false },
    tgeDate: { type: Date },
    tgePercentage: { type: Number },
    releaseCycle: { type: Number },
    releasePercent: { type: Number },
    claimed: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("TokenLock", TokenLockSchema);
