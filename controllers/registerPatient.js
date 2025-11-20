const patient=require("../databases/patients.js");
const bcrypt=require("bcryptjs");

const registerPatient=async function(req,res){
try{
    const{name,email,phone,age,password,gender,confirm_password}=req.body;


if(!name  || !email || !phone || !password || !confirm_password){
    return res.status(400).json({
        success:false,
        message:"Name, email, phone, and password are required",
    });
}

  if(confirm_password!==password){
      return  res.status(400).json({
            success:false,
            message:"password don't match"
        })
    }
//if email alreadyy exist then 
const findpatient=await patient.findOne({email});
if(findpatient){
return res.status(400).json({
      success: false,
    message:"user already exist!"
})
}

const hashedpassword=await bcrypt.hash(password,10);

    const createPatient=await patient.create({name,email,phone,password:hashedpassword,
        age,gender
    });

  
    //send success response
return res.render("login");   // will open login page

}
catch(err){
    console.log(err);
return res.status(500).json({
    success:false,
    message:"error registering patient",
    error:err.message,
});
}
};

module.exports=registerPatient;