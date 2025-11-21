// routes/patientRoutes.js
const express = require('express');
const router = express.Router();
const registerPatient = require('../controllers/registerPatient');
const loginPatient = require('../controllers/loginPatient');
const isPatientLoggedIn = require('../middleware/isLoggedIn');
const bookController = require('../controllers/patientController');
const patientController = require('../controllers/patientController');

// homepage
router.get("/", async (req, res) => {
    const Resource = require("../databases/HospitalResource");
    const resources = await Resource.findOne();

    res.render("home", {
        resources,
        patientId: req.session.patientId || null
    });
});

// register
router.get('/register', (req, res) => res.render('register'));
router.post('/register', registerPatient);

// login
router.get('/login', (req, res) => res.render('login'));
router.post('/login', loginPatient);

// profile — always pass session data to the view
router.get('/profile', isPatientLoggedIn, (req, res) => {
  res.render('profile', {
    name: req.session.patientName,
    email: req.session.patientEmail,
    patientId: req.session.patientId,
    token: req.session.token || null
  });
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
