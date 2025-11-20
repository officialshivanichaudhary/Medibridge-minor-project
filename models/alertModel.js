const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  medicine: String,
  batchNumber: String,
  daysLeft: Number,
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Alert", alertSchema);
