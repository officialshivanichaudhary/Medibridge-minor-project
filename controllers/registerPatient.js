const Patient = require("../databases/patients.js");
const bcrypt = require("bcryptjs");
const Donor = require("../databases/Donor");

const registerPatient = async function (req, res) {
  try {
    const {
      name,
      email,
      phone,
      age,
      password,
      gender,
      bloodGroup,
      confirm_password,
      registerAsDonor // <-- checkbox field sent from form
    } = req.body;

    if (!name || !email || !phone || !password || !confirm_password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone, and password are required",
      });
    }

    if (confirm_password !== password) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // check if email already exists
    const findPatient = await Patient.findOne({ email });
    if (findPatient) {
      return res.status(400).json({
        success: false,
        message: "User already exists!",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

if (!req.session.emailVerified || req.session.registerEmail !== email) {
  return res.render("register", {
    error: "Please verify your email first.",
  });
}


    // CREATE PATIENT
    const createPatient = await Patient.create({
      name,
      email,
      phone,
      password: hashedPassword,
      age,
      gender,
      bloodGroup: bloodGroup || null,
      isDonor: false,
        emailVerified: true
    });

    // ⭐ OPTIONAL: If user checks "Register as donor"
    if (registerAsDonor === "on" && bloodGroup) {
      await Donor.findOneAndUpdate(
        { email },
        {
          name,
          email,
          phone,
          bloodGroup,
          isActive: true,
        },
        { upsert: true, new: true }
      );

      // mark the patient as donor
      createPatient.isDonor = true;
      await createPatient.save();
    }

    // save session
    req.session.patientId = createPatient._id;
    req.session.patientName = createPatient.name;
    req.session.patientEmail = createPatient.email;
    req.session.isDonor = createPatient.isDonor;

    // redirect to login page after successful register
    return res.render("login", { error: null });

  } catch (err) {
    console.error("registerPatient error:", err);
    return res.render("register", {
      error: "Something went wrong while registering.",
    });
  }
};

module.exports = registerPatient;