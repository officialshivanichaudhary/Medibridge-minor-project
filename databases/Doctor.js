const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  password: String,
  department: { type: String, required: true },
  opdDays: [String],            // ["Monday","Wednesday"]
  avgConsultTime: { type: Number, default: 10 }, // minutes
  maxPatientsPerDay: { type: Number, default: 30 },
  onlineBookingLimit: { type: Number }, // optional override; if absent we'll compute from percent
  maxLeavePerMonth: { type: Number, default: 4 },
  onLeaveDates: [
    {
      type: String, // format: "YYYY-MM-DD"
    }
  ],// 🩺 Dates when doctor is unavailable (YYYY-MM-DD)
  offlineReservePercent: { type: Number, default: 20 } // reserve percentage for offline tokens
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
