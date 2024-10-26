const mongoose = require("mongoose");

const airdropSchema = new mongoose.Schema(
  {
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
    airdropAddress: {
      type: String,
    },
    airdropWallet: {
      type: String,
    },
    title: {
      type: String,
    },
    logo: {
      type: String,
    },
    website: {
      type: String,
    },
    twitter: {
      type: String,
    },
    reddit: {
      type: String,
    },
    telegram: {
      type: String,
    },
    github: {
      type: String,
    },
    facebook: {
      type: String,
    },
    description: {
      type: String,
    },
    tokenAddress: {
      type: String,
    },
    instagram: {
      type: String,
    },
    discord: {
      type: String,
    },
    allocations: {
      type: String,
    },
    proof: {
      type: String,
    },
    airdropStart: {
      type: String,
    },
    airdropEnd: {
      type: String,
    },
    creatorAddress: {
      type: String,
    },
    totalToken: {
      type: String,
    },
    participants: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Airdrop", airdropSchema);
