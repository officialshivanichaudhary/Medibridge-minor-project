// models/medicineModel.js
const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    batchNumber: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      default: 0,
    },
    manufactureDate: {
      type: Date,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    supplier: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Valid", "Near Expiry", "Expired"],
      default: "Valid",
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model("Medicine", medicineSchema);