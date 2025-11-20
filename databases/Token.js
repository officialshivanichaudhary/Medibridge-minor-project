const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },

  // embedded doctor info (keeps snapshot at booking time)
  doctor: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    name: String,
    department: String
  },

  date: { type: String, required: true }, // "YYYY-MM-DD"
  slotTime: String,        // "09:30" (HH:mm)
  estimatedTime: String,   // "09:30", or "09:30 AM"
  problem: String,
  tokenNumber: Number,
  customToken: String, 
  mode: { type: String, enum: ['Online', 'Offline'], default: 'Online' },
  status: { type: String, default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Token', tokenSchema);
