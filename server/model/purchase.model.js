const mongoose = require("mongoose");

// Purchase schema
const purchaseSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    icoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ICO",
      required: true,
    },
    amount: {
      type: String,
      required: true,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    isClaimed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Purchase", purchaseSchema);
