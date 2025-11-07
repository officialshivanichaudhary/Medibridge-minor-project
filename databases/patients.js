const mongoose =require ("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/hospitalDB");

const patientSchema=new mongoose.Schema({
    name:{type:String,required:true},
    email:{type:String,unique:true,required:true},
    phone:{type:String,required:true},
    password:{type:String,required:true},
    age:{type:Number},
    gender:String,
    tokenBooked:[
        {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment"
  }
    ]
},{timestamps:true});

module.exports=mongoose.model("patient",patientSchema);