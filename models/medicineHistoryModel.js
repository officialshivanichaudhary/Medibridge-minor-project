const mongoose = require("mongoose");

const medicineHistorySchema = new mongoose.Schema(
  {
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine" }, // original _id
    name: String,
    batchNumber: String,
    quantity: Number,
    manufactureDate: Date,
    expiryDate: Date,
    supplier: String,

    // jab delete hua tab ki info
    statusAtDelete: { type: String, default: "Expired/Removed" },
    deleteReason: { type: String, default: "Removed from stock" }, // e.g. "Expired", "Damaged", "Manual"
    deletedByRole: { type: String, default: "Pharmacist" },        // optional
    deletedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicineHistory", medicineHistorySchema);