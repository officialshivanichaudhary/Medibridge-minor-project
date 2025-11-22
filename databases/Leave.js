const mongoose = require("mongoose");

const LeaveSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true
  },
  date: {
    type: String,   // YYYY-MM-DD format
    required: true
  },
  reason: {
    type: String,
    default: ""
  }
}, { timestamps: true });

module.exports = mongoose.model("Leave", LeaveSchema);
