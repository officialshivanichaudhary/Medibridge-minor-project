const patient=require("../databases/patients.js");
const bcrypt=require("bcryptjs");



const  loginPatient=async function(req,res){
    const{email,password}=req.body;

    //if user not exist redirect to register page
const existingPatient= await patient.findOne({email});
if(!existingPatient){
    return res.render("register", { message: "User not found. Please register." });
}

//compare password
const ismatch=await bcrypt.compare(password,existingPatient.password);
if(!ismatch){
  return res.render("login", { error: "Invalid email or password" });
}
//login success
 return res.send(`welcome ${existingPatient.name} you're logged in`);

}

module.exports=loginPatient;