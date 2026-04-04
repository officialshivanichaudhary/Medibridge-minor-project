const express = require('express');
const router = express.Router();

const Patient = require("../databases/patients");
const Donor = require("../databases/Donor");
const transporter = require("../config_old/nodemailer");

// 🩸 DONATE PAGE (only logged-in donors)
router.get("/donate", (req, res) => {
  if (!req.session.patientId) return res.redirect("/login");

  if (!req.session.isDonor) {
    return res.send("⚠ You are not registered as a donor.");
  }

   return res.redirect("/");
});


// 🩸 DONOR REGISTRATION PAGE (only for NEW USERS)
router.get("/register", (req, res) => {
  res.render("donorRegister", { message: null, error: null });
});






// 🩸 NEW USER → REGISTER DIRECTLY AS DONOR
router.post("/register-new", async (req, res) => {
  try {
    const { name, email, phone, bloodGroup } = req.body;

    if (!name || !email || !bloodGroup) {
      return res.render("donorRegister", {
        error: "Name, email, blood group required.",
        message: null,
      });
    }

    await Donor.findOneAndUpdate(
      { email },
      { name, email, phone, bloodGroup, isActive: true },
      { upsert: true, new: true }
    );

    return res.redirect("/login");

  } catch (err) {
    console.error("register-new donor error:", err);
    return res.render("donorRegister", {
      error: "Something went wrong.",
      message: null,
    });
  }
});


// 🩸 EXISTING LOGGED-IN PATIENT → BECOME DONOR (NO FORM)
router.get("/become", async (req, res) => {
  try {
    if (!req.session.patientId) return res.redirect("/login");

    const patient = await Patient.findById(req.session.patientId);

    if (!patient) return res.send("⚠ Patient not found.");
 if (!patient.bloodGroup) {
      return res.render("profile", {
        name: patient.name,
        email: patient.email,
        phone: patient.phone || "",
        bloodGroup: patient.bloodGroup || "",
        donorSuccess: null,
        bloodGroupError: "⚠ Please update your blood group to become a donor."
      });
    }

    // Add to Donor collection
    await Donor.findOneAndUpdate(
      { email: patient.email },
      {
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        bloodGroup: patient.bloodGroup,
        isActive: true
      },
      { upsert: true }
    );

    // Mark patient as donor
    patient.isDonor = true;
    await patient.save();

    // Update session
    req.session.isDonor = true;

// Send thank-you email
    await transporter.sendMail({
        from: "dobhaal070105@gmail.com",
        to: patient.email,
        subject: "Thank You for Becoming a Blood Donor ❤️",
        html: `
            <h2>❤️ Thank You for Becoming a Donor!</h2>
            <p>Dear ${patient.name},</p>
            <p>Thank you for registering as a blood donor.</p>
            <p>Whenever your blood group is needed urgently, you will receive an email notification.</p>
            <p>We appreciate your support 🙏</p>
        `
    });

 const Resource = require("../databases/HospitalResource");
    const hospitalRes = await Resource.findOne({});

    const units = hospitalRes.bloodStock[patient.bloodGroup];
    const THRESHOLD = 4;

    if (units > 0 && units <= THRESHOLD) {
     
    }
  req.session.donorSuccess = "🎉 Thank you for becoming a Blood Donor!";
     return res.redirect("/");   // ✅ Redirect to home (NOT JSON)

  } catch (err) {
    console.error("become donor error:", err);
    res.send("Error converting to donor.");
  }
});


module.exports = router;
