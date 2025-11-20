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

//save datain session after login
req.session.patientId = existingPatient._id;
req.session.patientName = existingPatient.name;
req.session.patientEmail = existingPatient.email;


//login success
res.render("profile", {
  name: req.session.patientName,
  email: req.session.patientEmail,
  patientId: req.session.patientId,
  token: req.session.token || null
});

}

module.exports=loginPatient;