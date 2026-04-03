// routes/patientRoutes.js
const express = require('express');
const router = express.Router();
const registerPatient = require('../controllers/registerPatient');
const loginPatient = require('../controllers/loginPatient');
const isPatientLoggedIn = require('../middleware/isLoggedIn');
const bookController = require('../controllers/patientController');
const patientController = require('../controllers/patientController');
const Patient = require("../databases/patients");
const transporter = require("../config_old/nodemailer");
const otpStore = {};   // email → { otp, expires }

// homepage
// router.get("/", async (req, res) => {
//     const Resource = require("../databases/HospitalResource");
//     const resources = await Resource.findOne();
//    // if loginPatient already set isDonor, reuse it
//   const isDonor = req.session.isDonor || false;
//     res.render("home", {
//         resources,
//         patientId: req.session.patientId || null,
//          isDonor
//     });
// });

// homepage
router.get("/", async (req, res) => {
  const Resource = require("../databases/HospitalResource");
  
  let resources = await Resource.findOne();

  // If no resource exists, create one default record
  if (!resources) {
    resources = await Resource.create({});
  }

  const isDonor = req.session.isDonor || false;

  res.render("home", {
    resources,
    patientId: req.session.patientId || null,
    isDonor
  });
});


// register
router.get('/register', (req, res) => res.render('register', { error: null }));

router.post('/register', registerPatient);

// login
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  try {
    await loginPatient(req, res);
  } catch (err) {
    console.log(err);
    res.render("login", { error: "Invalid Email or Password" });
  }
});


// profile — always pass session data to the view
router.get("/profile", async (req, res) => {
    if (!req.session.patientId) return res.redirect("/login");

    const patient = await Patient.findById(req.session.patientId);

    const msg = req.session.donorSuccess;
    req.session.donorSuccess = null; // clear after showing

    res.render("profile", {
        name: patient.name,
        email: patient.email,
            phone: patient.phone || "",
                bloodGroup: patient.bloodGroup || "",
        patientId: patient._id,
        isDonor: req.session.isDonor,
        donorSuccess: msg     // ⭐ message passed here
    });
});

router.post("/send-otp", async (req, res) => {
  try {
    const Patient = require("../databases/patients"); 
    const { email } = req.body;
const existingUser = await Patient.findOne({
  email: { $regex: new RegExp("^" + email + "$", "i") }
});

if (existingUser) {
  return res.json({
    success: false,
    message: "You already have an account. Please login."
  });
}
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000;

        otpStore[email] = { otp, expires };
 

    await transporter.sendMail({
      from: "dobhaal070105@gmail.com",
      to: email,
      subject: "MediBridge Email Verification OTP",
      html: `
        <h2>🔐 Email Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP will expire in <b>5 minutes</b>.</p>
      `
    });

    res.json({ success: true, message: "OTP sent to email." });

  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Error sending OTP." });
  }
});

router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!otpStore[email])
    return res.json({ success: false, message: "OTP not sent." });

  const correctOTP = otpStore[email].otp;
  const expires = otpStore[email].expires;

  if (Date.now() > expires)
    return res.json({ success: false, message: "OTP expired." });

  if (otp !== correctOTP)
    return res.json({ success: false, message: "Invalid OTP." });

  // Mark verified
  req.session.emailVerified = true;
  req.session.registerEmail = email;

  delete otpStore[email];

  res.json({ success: true, message: "Email verified successfully!" });
});





// UPDATE PROFILE (email, phone, blood group)
router.post("/update-profile", async (req, res) => {
  try {
    if (!req.session.patientId) return res.redirect("/login");

    const patient = await Patient.findById(req.session.patientId);
    if (!patient) return res.send("Patient not found.");

    const { email, phone, bloodGroup } = req.body;

    // Update fields (only if provided)
    if (email) patient.email = email;
    if (phone) patient.phone = phone;
    if (bloodGroup) patient.bloodGroup = bloodGroup;

    await patient.save();

    // Update session also
    req.session.patientEmail = patient.email;
    req.session.bloodGroup = patient.bloodGroup;

    res.redirect("/profile");

  } catch (err) {
    console.log(err);
    res.send("Failed to update profile.");
  }
});



// show available slots (next 7 days starting tomorrow)
router.get('/get-available-slots', isPatientLoggedIn, bookController.getAvailableSlots);

// book selected slot (form POST from availableSlots.ejs)
router.post('/book-token', isPatientLoggedIn, bookController.bookToken);

router.post("/update-email", async (req, res) => {
  try {
    const { newEmail } = req.body;
    const patientId = req.session.patientId;

    if (!patientId) return res.status(401).json({ message: "⚠️ Please log in first." });
    if (!newEmail || !newEmail.includes("@"))
      return res.status(400).json({ message: "⚠️ Invalid email format." });

    const existing = await Patient.findOne({ email: newEmail });
    if (existing)
      return res.status(400).json({ message: "⚠️ This email is already registered." });

    await Patient.findByIdAndUpdate(patientId, { email: newEmail });
    req.session.patientEmail = newEmail;

    return res.json({ message: "✅ Email updated successfully!" });
  } catch (err) {
    console.error("Error updating email:", err);
    return res.status(500).json({ message: "🚫 Failed to update email." });
  }
});

router.get("/generate-token-check", (req, res) => {
  if (req.session && req.session.patientId) {
    // Already logged in → token page/profile
    return res.redirect("/profile");
  }

  // User NOT logged in → login first
  return res.redirect("/login");
});

// logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error(err);
    res.redirect('/login');
  });
});


// public route
router.get('/resources', patientController.viewResources);



module.exports = router;