// models/alertModel.js
const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    medicine: {
      type: String,
      required: true,
      trim: true,
    },
    batchNumber: {
      type: String,
      required: true,
      trim: true,
    },
    daysLeft: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["Near Expiry", "Expired"],
      default: "Near Expiry",
    },
    // is field pe hum sort kar rahe the:  sort({ date: -1 })
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // extra: createdAt / updatedAt bhi mil jayega
  }
);

module.exports = mongoose.model("Alert", alertSchema);