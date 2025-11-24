const patient = require("../databases/patients.js");
const Donor = require("../databases/Donor");
const bcrypt = require("bcryptjs");

const loginPatient = async function (req, res) {
  const { email, password } = req.body;

  const existingPatient = await patient.findOne({ email });
  if (!existingPatient) {
    return res.render("register", { message: "User not found. Please register." });
  }

  const ismatch = await bcrypt.compare(password, existingPatient.password);
  if (!ismatch) {
    return res.render("login", { error: "Invalid email or password" });
  }

  // Save session (patient login successful)
  req.session.patientId = existingPatient._id;
  req.session.patientName = existingPatient.name;
  req.session.patientEmail = existingPatient.email;
req.session.bloodGroup = existingPatient.bloodGroup || null;

  // Check if patient is also a donor
  const donor = await Donor.findOne({
    email: existingPatient.email,
    isActive: true
  });

  req.session.isDonor = donor ? true : false;

  // Render profile
  return res.render("profile", {
    name: existingPatient.name,
    email: existingPatient.email,
    patientId: existingPatient._id,
    isDonor: req.session.isDonor
  });
};

module.exports = loginPatient;
