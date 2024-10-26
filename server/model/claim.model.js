const mongoose = require("mongoose");

// Purchase schema
const claimSchema = new mongoose.Schema(
  {
    userAddress: {
      type: String,
      required: true,
    },
    airdropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Airdrop",
      required: true,
    },
    amount: {
      type: String,
      required: true,
    },
    claimDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Claim", claimSchema);
