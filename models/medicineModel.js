const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  batchNumber: String,
  quantity: Number,
  manufactureDate: Date,
  expiryDate: Date,
  supplier: String,
  status: {
    type: String,
    enum: ["Valid", "Near Expiry", "Expired"],
    default: "Valid"
  },
  addedBy: { type: String } // pharmacist name or ID
}, { timestamps: true });

module.exports = mongoose.model("Medicine", medicineSchema);
