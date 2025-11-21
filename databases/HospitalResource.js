const mongoose = require("mongoose");

const hospitalResourceSchema = new mongoose.Schema({
  beds: {
    general: {
      total: { type: Number, default: 0 },
      occupied: { type: Number, default: 0 }
    },
    icu: {
      total: { type: Number, default: 0 },
      occupied: { type: Number, default: 0 }
    },
    hdu: {
      total: { type: Number, default: 0 },
      occupied: { type: Number, default: 0 }
    },
    privateRoom: {
      total: { type: Number, default: 0 },
      occupied: { type: Number, default: 0 }
    },
    emergency: {
      total: { type: Number, default: 0 },
      occupied: { type: Number, default: 0 }
    },
  },

  oxygenCylinders: {
    total: { type: Number, default: 0 },
    used: { type: Number, default: 0 }
  },

  ventilators: {
    total: { type: Number, default: 0 },
    used: { type: Number, default: 0 }
  },

  bloodStock: {
    "A+": { type: Number, default: 0 },
    "A-": { type: Number, default: 0 },
    "B+": { type: Number, default: 0 },
    "B-": { type: Number, default: 0 },
    "AB+": { type: Number, default: 0 },
    "AB-": { type: Number, default: 0 },
    "O+": { type: Number, default: 0 },
    "O-": { type: Number, default: 0 }
  },

  lastUpdatedBy: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("HospitalResource", hospitalResourceSchema);
