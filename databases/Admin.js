const mongoose= require ('mongoose');
const adminSchema=new mongoose.Schema({
    email:{type:String,required:true},
    password:{type:String,required:true},
    role:{type:String,default:"SUPER_ADMIN_"}
});

module.exports=mongoose.model("Admin",adminSchema);