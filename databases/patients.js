const mongoose =require ("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/hospitalDB");

const patientSchema=new mongoose.Schema({
    name:{type:String,required:true},
    email:{type:String,unique:true,required:true},
    phone:{type:String,required:true},
    password:{type:String,required:true},
    age:{type:Number},
    emailVerified: { type: Boolean, default: false },
otp: { type: String },
otpExpires: { type: Date },
    gender:String,
    bloodGroup: {
    type: String,
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  },

  // optional flag if you want
  isDonor: { type: Boolean, default: false },
    tokenBooked:[
        {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment"
  }
    ]
},{timestamps:true});

module.exports=mongoose.model("patient",patientSchema);