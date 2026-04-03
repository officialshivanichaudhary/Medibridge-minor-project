const Admin = require("../databases/Admin");
const Doctor = require("../databases/Doctor");
const Token = require("../databases/Token");
const Resource = require("../databases/HospitalResource");
const nodemailer = require("nodemailer");
const Patient = require("../databases/patients");
const Leave = require("../databases/Leave");
const Donor = require("../databases/Donor");
const pickDoctorForDay = require("../utils/pickDoctor");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const todayDay = WEEKDAYS[new Date().getDay()];

// ================= LOGIN =================
exports.adminLoginPage = (req, res) => res.render("adminLogin");

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  // .env based login
  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    req.session.isAdmin = true;
    return res.redirect("/admin/dashboard");
  }

  return res.render("adminLogin", {
    error: "Invalid email or password"
  });
};

// ================= DASHBOARD =================
exports.adminDashboard = async (req, res) => {
  try {
    let resources = await Resource.findOne();
    const doctors = await Doctor.find();
    const today = new Date().toISOString().split("T")[0];

    const todaysTokens = await Token.find({
      date: today,
      mode: "Offline"
    }).sort({ tokenNumber: 1 });

    if (!resources) {
      resources = {
        beds: {
          icu: {},
          general: {},
          hdu: {},
          privateRoom: {},
          emergency: {}
        },
        oxygenCylinders: {},
        ventilators: {},
        bloodStock: {}
      };
    }

    res.render("adminDashboard", {
      resources,
      doctors,
      todaysTokens,
      lastOfflineToken: req.session.lastOfflineToken || null
    });

    req.session.lastOfflineToken = null;
  } catch (err) {
    console.log("Dashboard Error:", err);
    res.send("Error loading dashboard");
  }
};

// ================= UPDATE HOSPITAL RESOURCES =================
exports.updateHospitalResources = async (req, res) => {
  try {
    let resources = await Resource.findOne() || new Resource();
    const b = req.body;

    resources.beds.icu.total = b.icu_total;
    resources.beds.icu.occupied = b.icu_occupied;

    resources.beds.general.total = b.general_total;
    resources.beds.general.occupied = b.general_occupied;

    resources.beds.hdu.total = b.hdu_total;
    resources.beds.hdu.occupied = b.hdu_occupied;

    resources.beds.privateRoom.total = b.private_total;
    resources.beds.privateRoom.occupied = b.private_occupied;

    resources.beds.emergency.total = b.emergency_total;
    resources.beds.emergency.occupied = b.emergency_occupied;

    resources.oxygenCylinders.total = b.oxygen_total;
    resources.oxygenCylinders.used = b.oxygen_used;

    resources.ventilators.total = b.ventilator_total;
    resources.ventilators.used = b.ventilator_used;

    await resources.save();
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("Hospital update error:", err);
    res.send("Error updating hospital data");
  }
};

// ================= UPDATE BLOOD STOCK =================
exports.updateBloodStock = async (req, res) => {
  console.log("updateBloodStock hit");
  try {
    let resources = await Resource.findOne() || new Resource();
    const bloodGroups = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

    for (let bg of bloodGroups) {
      const value = req.body[`blood_${bg}`] || 0;
      resources.bloodStock[bg] = value;

      if (value < 5) {
        console.log("Low blood:", bg);

        const donors = await Donor.find({ bloodGroup: bg });
        console.log("Donors:", donors);

        const emails = donors
          .map(d => d.email)
          .filter(e => e); 

        if (emails.length > 0) {
          console.log("Sending email to:", emails);

          try {
            const info = await transporter.sendMail({
              
  from: "dobhaal070205@gmail.com" ,
  to: "YOUR_EMAIL@gmail.com",
  subject: "TEST",
  text: "check"
});
        

            console.log("✅ Blood email sent:", info.response);

          } catch (mailErr) {
            console.log("❌ Blood mail error:", mailErr);
          }

        } else {
          console.log("❌ No valid donor emails for", bg);
        }
      }
    }

    await resources.save();
    res.redirect("/admin/dashboard");

  } catch (err) {
    console.error("Blood update error:", err);
    res.send("Error updating blood stock");
  }
};
// ================= DOCTORS CRUD =================
exports.viewDoctors = async (req, res) => {
  const doctors = await Doctor.find();
  res.render("adminDoctors", { doctors });
};

exports.addDoctor = async (req, res) => {
  const d = req.body;
  let opdDays = d.opdDays || [];
  if (!Array.isArray(opdDays)) opdDays = [opdDays];

  await Doctor.create({
    name: d.name,
    department: d.department,
    maxPatientsPerDay: d.maxPatientsPerDay,
    avgConsultTime: d.avgConsultTime,
    opdDays,
    maxLeavePerMonth: d.maxLeavePerMonth || 4,
    offlineReservePercent: d.offlineReservePercent || 20
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
  const d = req.body;
  let opdDays = d.opdDays || [];
  if (!Array.isArray(opdDays)) opdDays = [opdDays];

  await Doctor.findByIdAndUpdate(req.params.id, {
    name: d.name,
    department: d.department,
    maxPatientsPerDay: d.maxPatientsPerDay,
    avgConsultTime: d.avgConsultTime,
    opdDays,
    maxLeavePerMonth: d.maxLeavePerMonth || 4,
    offlineReservePercent: d.offlineReservePercent || 20
  });

  res.redirect("/admin/doctors");
};

// ================= OFFLINE TOKENS =================
exports.viewAllOfflineTokens = async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const tokens = await Token.find({ date: today, mode: "Offline" })
    .sort({ tokenNumber: 1 });
  res.render("offlineTokens", { tokens });
};

exports.generateOfflineToken = async (req, res) => {
  try {
    const { patientName, department } = req.body;
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const dayName = WEEKDAYS[now.getDay()];

    const doctor = await pickDoctorForDay(department, dayName, todayStr);
    if (!doctor) return res.send("No doctor available today.");

    const last = await Token.findOne({
      "doctor.id": doctor._id,
      date: todayStr,
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
      date: todayStr,
      timeSlot: "Offline",
      mode: "Offline"
    });

    req.session.lastOfflineToken = newToken;
    res.redirect("/admin/dashboard");

  } catch (err) {
    console.error("Offline Token Error:", err);
    res.send("Error generating token");
  }
};

// ================= LEAVE MANAGEMENT =================
exports.leaveForm = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.send("Doctor not found");

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const todayDay = today.toLocaleDateString("en-US", { weekday: "long" });

    const upcomingLeaves = await Leave.find({
      doctor: doctor._id,
      date: { $gte: todayStr }
    }).sort({ date: 1 });

    res.render("doctorLeave", {
      doctor,
      todayStr,
      todayDay,
      upcomingLeaves,
      error: null,
      success: null
    });

  } catch (err) {
    console.error("Leave Form Error:", err);
    res.send("Error loading leave form");
  }
};

exports.markLeave = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.send("Doctor not found");

    const { leaveDate, reason } = req.body;
    const todayStr = new Date().toISOString().split("T")[0];

    const upcomingLeaves = await Leave.find({ doctor: doctor._id });

    if (!leaveDate) {
      return res.render("doctorLeave", {
        doctor, todayStr, todayDay, upcomingLeaves,
        error: "Please select a leave date.", success: null
      });
    }

    if (leaveDate < todayStr) {
      return res.render("doctorLeave", {
        doctor, todayStr, todayDay, upcomingLeaves,
        error: "Leave date cannot be in the past.", success: null
      });
    }

    // ✅ Save leave
    await Leave.findOneAndUpdate(
      { doctor: doctor._id, date: leaveDate },
      { doctor: doctor._id, date: leaveDate, reason: reason || "" },
      { upsert: true, new: true }
    );

    // 🔥 STEP 1: find affected tokens
    const tokens = await Token.find({
      "doctor.id": doctor._id,
      date: new Date(leaveDate).toISOString().split("T")[0]
    });
let filteredTokens = tokens;

// 🔥 fallback (IMPORTANT)
if (tokens.length === 0) {
  const allTokens = await Token.find({
    date: new Date(leaveDate).toISOString().split("T")[0]
  });

  filteredTokens = allTokens.filter(t =>
    t.doctor &&
    t.doctor.id &&
    t.doctor.id.toString() === doctor._id.toString()
  );
}
    const dayName = new Date(leaveDate).toLocaleDateString("en-US", { weekday: "long" });

    // 🔥 STEP 2: loop tokens
    for (let t of filteredTokens) {

      // pick new doctor
      let newDoctor = await pickDoctorForDay(
        t.doctor.department,
        dayName,
        leaveDate
      );

      // ❗ FIX: ensure same doctor reassign na ho
      if (newDoctor && newDoctor._id.toString() === doctor._id.toString()) {
        // try to find another doctor manually
        const otherDoctors = await Doctor.find({
          department: t.doctor.department,
          _id: { $ne: doctor._id }
        });

        newDoctor = otherDoctors[0] || null;
      }

      if (!newDoctor) continue;

      // 🔁 update token doctor
      t.doctor = {
        id: newDoctor._id,
        name: newDoctor.name,
        department: newDoctor.department
      };

      await t.save();

      // 🔍 get patient
      if (!t.patientId) continue; // skip offline tokens

      const patient = await Patient.findById(t.patientId);

      // 📩 send email
      if (patient && patient.email) {
        console.log("Token:", t);
console.log("PatientId:", t.patientId);
        try {
          await transporter.sendMail({
            to: patient.email,
            subject: "Doctor Reassigned - MediBridge",
            text: `Due to emergency, your doctor has been changed to ${newDoctor.name} (${newDoctor.department}) for date ${leaveDate}. Your token remains the same.`
          });

          console.log("Reassign mail sent to:", patient.email);

        } catch (err) {
          console.log("Mail error:", err);
        }
      }
    }

    // ✅ update doctor leave list
    if (!doctor.onLeaveDates) doctor.onLeaveDates = [];
    if (!doctor.onLeaveDates.includes(leaveDate)) {
      doctor.onLeaveDates.push(leaveDate);
      await doctor.save();
    }

    const updatedLeaves = await Leave.find({
      doctor: doctor._id,
      date: { $gte: todayStr }
    }).sort({ date: 1 });

    res.render("doctorLeave", {
      doctor,
      todayStr,
      todayDay,
      upcomingLeaves: updatedLeaves,
      error: null,
      success: "Leave saved successfully!"
    });

  } catch (err) {
    console.error("Mark Leave Error:", err);
    res.send("Error saving leave");
  }
};
