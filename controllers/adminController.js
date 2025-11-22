const Admin = require("../databases/Admin");
const Doctor = require("../databases/Doctor");
const Token = require("../databases/Token");
const Resource = require("../databases/HospitalResource"); // create this model
const nodemailer = require("nodemailer");
const Patient = require("../databases/patients"); 
const Leave = require("../databases/Leave");

// Your transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "dobhaal2005@gmail.com",
    pass: "eqrp bivz btry chjm"
  }
});

// ⭐ Helper for date string + weekdays
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const todayDay = WEEKDAYS[new Date().getDay()];


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


// SHOW LEAVE FORM
// GET: /admin/doctor/:id/leave

exports.leaveForm = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.send("Doctor not found");

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayDay = WEEKDAYS[today.getDay()];

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
    console.log(err);
    res.send("Error loading leave form");
  }
};




// MARK LEAVE + SEND EMAILS TO PATIENTS
// POST: /admin/doctor/:id/leave

exports.markLeave = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.send("Doctor not found");

    const { leaveDate, reason } = req.body;
    const todayStr = new Date().toISOString().split("T")[0];

    if (!leaveDate) {
      return res.render("doctorLeave", {
        doctor,
        todayStr,
        error: "Please select a leave date.",
        success: null,
      });
    }

    if (leaveDate < todayStr) {
      return res.render("doctorLeave", {
        doctor,
        todayStr,
        error: "Leave date cannot be in the past.",
        success: null,
      });
    }

    // 1️⃣ Leave entry save / update
    await Leave.findOneAndUpdate(
      { doctor: doctor._id, date: leaveDate },
      { doctor: doctor._id, date: leaveDate, reason: reason || "" },
      { upsert: true, new: true }
    );

    // Doctor document pe bhi onLeaveDates push karo (UI ke liye)
    if (!Array.isArray(doctor.onLeaveDates)) doctor.onLeaveDates = [];
    if (!doctor.onLeaveDates.includes(leaveDate)) {
      doctor.onLeaveDates.push(leaveDate);
      await doctor.save();
    }

    // 2️⃣ Already booked tokens ke liye: emergency leave → reassign logic
    const tokens = await Token.find({
      "doctor.id": doctor._id,
      date: leaveDate,
    });

    for (const token of tokens) {
      // Same department ka dusra doctor dhoondo (jo ye doctor nahi hai)
      const alternateDoctor = await Doctor.findOne({
        department: doctor.department,
        _id: { $ne: doctor._id },
      });

      if (!alternateDoctor) {
        // ❌ Koi alternate doctor nahi mila → patient ko cancellation mail
        if (token.patientId) {
          const patient = await Patient.findById(token.patientId);
          if (patient && patient.email) {
            await transporter.sendMail({
              from: "dobhaal2005@gmail.com",
              to: patient.email,
              subject: "Appointment cancelled - doctor on leave",
              html: `
                <p>Dear ${patient.name || "Patient"},</p>
                <p>Your appointment on <b>${leaveDate}</b> with <b>${
                  doctor.name
                }</b> has been cancelled because the doctor is on emergency leave and no alternate doctor is available.</p>
                <p>We regret the inconvenience.</p>
              `,
            });
          }
        }

        // Token delete kar do (clean DB)
        await Token.findByIdAndDelete(token._id);
        continue;
      }

      // ✅ Alternate doctor mil gaya → token reassign
      token.doctor.id = alternateDoctor._id;
      token.doctor.name = alternateDoctor.name;
      token.doctor.department = alternateDoctor.department;
      await token.save();

      // Patient ko email – doctor change info
      if (token.patientId) {
        const patient = await Patient.findById(token.patientId);
        if (patient && patient.email) {
          await transporter.sendMail({
            from: "dobhaal2005@gmail.com",
            to: patient.email,
            subject: "Your doctor has been changed",
            html: `
              <p>Dear ${patient.name || "Patient"},</p>
              <p>Your appointment on <b>${leaveDate}</b> was originally with <b>${
                doctor.name
              }</b>.</p>
              <p>Due to emergency leave, it has been reassigned to <b>${
                alternateDoctor.name
              }</b> (${alternateDoctor.department}).</p>
              <p>Your token number remains the same: <b>${
                token.customToken
              }</b>.</p>
            `,
          });
        }
      }
    }

    return res.render("doctorLeave", {
      doctor,
      todayStr,
      error: null,
      success:
        "Leave saved and patients handled (reassigned to another doctor or cancelled).",
    });
  } catch (err) {
    console.error("markLeave error:", err);
    res.send("Error saving leave");
  }
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

         // agar DB me record hi nahi hai toh blank object bhej do
    if (!resources) {
      resources = {
        beds: {
          icu: {}, general: {}, hdu: {}, privateRoom: {}, emergency: {}
        },
        oxygenCylinders: {},
        ventilators: {},
        bloodStock: {}
      };
    }
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

  if (!Array.isArray(opdDays) && opdDays) {
    opdDays = [opdDays];  // single select case
  }


    await Doctor.create({
        name,
        department,
        maxPatientsPerDay,
        avgConsultTime,
          opdDays  
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

  
  if (!Array.isArray(opdDays) && opdDays) {
    opdDays = [opdDays];
  }

    await Doctor.findByIdAndUpdate(req.params.id, {
        name,
        department,
        maxPatientsPerDay,
        avgConsultTime,
        opdDays
    });

    res.redirect("/admin/doctors");
};


exports.generateOfflineToken = async (req, res) => {
  console.log("BODY RECEIVED:", req.body);

    const { patientName, department } = req.body;

    const today = new Date().toISOString().split("T")[0];

    // Fetch a doctor of that department
    const doctor = await Doctor.findOne({ department,
  $or: [
      { onLeaveDates: { $exists: false } },
      { onLeaveDates: { $ne: today } }
    ]
    });

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

