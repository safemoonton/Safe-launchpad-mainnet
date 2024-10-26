const mongoose = require("mongoose");
// ICO schema

const TierSchema = new mongoose.Schema({
  addresses: {
    type: [String],
    required: true,
  },
  delay: {
    type: Number,
    required: true,
  },
});

const icoSchema = new mongoose.Schema(
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
    launchpadAddress: {
      type: String,
    },
    launchpadWalletAddress: {
      type: String,
    },
    launchpadType: {
      type: String,
    },
    listingType: {
      type: String,
    },
    token_price: {
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
    total_token_sale: {
      type: String,
    },
    soft_cap: {
      type: String,
    },
    hard_cap: {
      type: String,
    },
    min_buy: {
      type: String,
    },
    max_buy: {
      type: String,
    },
    lp_jettons: {
      type: String,
    },
    lp_percent: {
      type: String,
    },
    listing_price: {
      type: String,
    },
    tokenAddress: {
      type: String,
    },
    start: {
      type: String,
    },
    end: {
      type: String,
    },
    instagram: {
      type: String,
    },
    discord: {
      type: String,
    },
    status: {
      type: String,
    },
    isCancelled: {
      type: String,
    },
    isClaimedRaise: {
      type: Boolean,
      default: false,
    },
    isClaimedLeftover: {
      type: Boolean,
      default: false,
    },
    listingPlatform: {
      type: String,
    },
    listingUrl: {
      type: String,
    },
    isAutoListed: {
      type: Boolean,
      default: false,
    },
    dexTime: {
      type: String,
    },
    isEnableListing: {
      type: Boolean,
      default: false,
    },
    creatorAddress: {
      type: String,
    },
    whitelistType: {
      type: String,
    },
    basicWhitelist: {
      type: String,
    },
    tieredWhitelist: {
      type: [TierSchema],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ICO", icoSchema);
