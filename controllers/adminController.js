const Admin = require("../databases/Admin");
const Doctor = require("../databases/Doctor");
const Token = require("../databases/Token");
const Resource = require("../databases/HospitalResource"); // create this model
const nodemailer = require("nodemailer");

// Your transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "dobhaal2005@gmail.com",
    pass: "eqrp bivz btry chjm"
  }
});

exports.adminLoginPage = (req, res) => {
    res.render("adminLogin");
};

exports.adminLogin = async (req, res) => {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email, password });

    if (!admin) {
        return res.render("adminLogin", { error: "Invalid email or password" });
    }

    req.session.isAdmin = true;
    req.session.adminId = admin._id;

    res.redirect("/admin/dashboard");
};

exports.adminDashboard = async (req, res) => {
    try {
        const resources = await Resource.findOne();
        const doctors = await Doctor.find();

        const today = new Date().toISOString().split("T")[0];

        const todaysTokens = await Token.find({
            date: today,
            mode: "Offline"
        }).sort({ tokenNumber: 1 });

        res.render("adminDashboard", {
            resources,
            doctors,
            todaysTokens,          // ⭐ MUST BE INCLUDED
            lastOfflineToken: req.session.lastOfflineToken || null
        });

        req.session.lastOfflineToken = null;

    } catch (err) {
        console.log("Dashboard Error:", err);
        res.send("Something went wrong loading admin dashboard");
    }
};

exports.viewAllOfflineTokens = async (req, res) => {
    const today = new Date().toISOString().split("T")[0];

    const tokens = await Token.find({
        date: today,
        mode: "Offline"
    }).sort({ tokenNumber: 1 });

    res.render("offlineTokens", { tokens });
};


exports.updateResources = async (req, res) => {
  try {
    const body = req.body;

    const updateObj = {
      beds: {
        icu: {
          total: body.icu_total,
          occupied: body.icu_occupied
        },
        general: {
          total: body.general_total,
          occupied: body.general_occupied
        },
        hdu: {
          total: body.hdu_total,
          occupied: body.hdu_occupied
        },
        privateRoom: {
          total: body.private_total,
          occupied: body.private_occupied
        },
        emergency: {
          total: body.emergency_total,
          occupied: body.emergency_occupied
        },
      },

      oxygenCylinders: {
        total: body.oxygen_total,
        used: body.oxygen_used
      },

      ventilators: {
        total: body.ventilator_total,
        used: body.ventilator_used
      },

      bloodStock: {},
      lastUpdatedBy: req.session.adminEmail
    };

    const bloodGroups = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

    bloodGroups.forEach(bg => {
      updateObj.bloodStock[bg] = body[`blood_${bg}`];
    });

    await Resource.findOneAndUpdate({}, updateObj, { new: true });

    res.redirect("/admin/dashboard");

  } catch (err) {
    console.error(err);
    res.send("Error updating resources.");
  }
};


// 🔴 Auto Email Alert Function
async function sendLowBloodAlert(group, units) {
  const mail = {
    from: "dobhaal2005@gmail.com",
    to: "all-donors@example.com",
    subject: `Urgent Blood Requirement: ${group}`,
    html: `
      <h2>⚠ Low Blood Alert</h2>
      <p>We are critically low on <b>${group}</b> blood group.</p>
      <p>Available Units: <b>${units}</b></p>
      <p>Please donate immediately at the hospital.</p>
    `
  };

  try {
    await transporter.sendMail(mail);
    console.log(`🚨 Blood Alert Email Sent for ${group}`);
  } catch (err) {
    console.log("Email failed:", err);
  }
}

exports.viewDoctors = async (req, res) => {
    const doctors = await Doctor.find();
    res.render("adminDoctors", { doctors });
};

exports.addDoctor = async (req, res) => {
    const { name, department, maxPatientsPerDay, avgConsultTime } = req.body;

    await Doctor.create({
        name,
        department,
        maxPatientsPerDay,
        avgConsultTime
    });

    res.redirect("/admin/doctors");
};

exports.deleteDoctor = async (req, res) => {
    await Doctor.findByIdAndDelete(req.params.id);
    res.redirect("/admin/doctors");
};

exports.editDoctorPage = async (req, res) => {
    const doctor = await Doctor.findById(req.params.id);
    res.render("editDoctor", { doctor });
};

exports.updateDoctor = async (req, res) => {
    const { name, department, maxPatientsPerDay, avgConsultTime } = req.body;

    await Doctor.findByIdAndUpdate(req.params.id, {
        name,
        department,
        maxPatientsPerDay,
        avgConsultTime
    });

    res.redirect("/admin/doctors");
};


exports.markLeave = async (req, res) => {
    const { doctorId, leaveDate } = req.body;

    await Token.deleteMany({ "doctor.id": doctorId, date: leaveDate });

    res.redirect("/admin/dashboard");
};
exports.generateOfflineToken = async (req, res) => {
  console.log("BODY RECEIVED:", req.body);

    const { patientName, department } = req.body;

    const today = new Date().toISOString().split("T")[0];

    // Fetch a doctor of that department
    const doctor = await Doctor.findOne({ department });

    if (!doctor) {
        return res.send("No doctor available for this department today.");
    }

    // Find last token for today and this doctor
    const last = await Token.findOne({
        "doctor.id": doctor._id,
        date: today,
        mode: "Offline"
    }).sort({ tokenNumber: -1 });

    const next = last ? last.tokenNumber + 1 : 1;

    const newToken = await Token.create({
        tokenNumber: next,
        customToken: `O${next}`,
        doctor: {
            id: doctor._id,
            name: doctor.name,
            department: doctor.department
        },
        offlineName: patientName,
        patientId: null,
        date: today,
        timeSlot: "Offline",
        mode: "Offline"
    });

    req.session.lastOfflineToken = newToken;

    res.redirect("/admin/dashboard");
};

