const mongoose=require('mongoose');

const  donorSchema=new mongoose.Schema({
     name:{type:String,required:true},
     email:{
        type:String,
        require:true,
        unique:true,
        trim:true,
        lowercase:true
     },
bloodGroup: {
      type: String,
      required: true,
      enum: ["A+","A-","B+","B-","AB+","AB-","O+","O-"]
    },

    phone: { type: String },

    lastDonated: { type: Date },

    isActive: { type: Boolean, default: true } // future me opt-out ke kaam aa sakta hai
  },
  { timestamps: true }

);

module.exports=mongoose.model("Donor",donorSchema);