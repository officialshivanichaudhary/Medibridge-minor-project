const mongoose=require("mongoose");

const leaveSchema = new mongoose.Schema({
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Doctor", 
    required: true 
  },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  totalDays: { type: Number, required: true, min: 1 },
  reason: { type: String, trim: true },
  status: { 
    type: String, 
    enum: ["Pending", "Approved", "Rejected"], 
    default: "Pending" 
  }
}, { timestamps: true });


module.exports=mongoose.model("Leave",leaveSchema);
