const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
        required: true
    },
    date: {
        type: String,   // YYYY-MM-DD
        required: true
    },
    reason: {
        type: String,
        default: ""
    }
});

module.exports = mongoose.model("Leave", leaveSchema);
