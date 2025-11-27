const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "dobhaal2005@gmail.com",
        pass: "eqrp bivz btry chjm"  
    }
});
console.log("Email Transporter Configured Successfully");
module.exports = transporter;
