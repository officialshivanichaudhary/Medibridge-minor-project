// controllers/patientController.js
const Doctor = require('../databases/Doctor');
const Token = require('../databases/Token');
const { addDays, format, addMinutes } = require('date-fns');
const nodemailer = require("nodemailer");
const HospitalResource = require('../databases/HospitalResource');
const Leave = require("../databases/Leave");

exports.viewResources = async (req, res) => {
  const data = await HospitalResource.findOne();
  res.render('resourceAvailability', { data });
};


// helper: format Date -> "YYYY-MM-DD"
function toDateString(d) {
  return format(new Date(d), 'yyyy-MM-dd');
}

// helper: format time to "HH:MM AM/PM"
function timeLabel(dateObj) {
  return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toUpperCase();
}


// build slots between 09:00 and 12:30 using doctor's avgConsultTime
function buildSlotsForDay(dateObj, avgConsultMins) {
  const start = new Date(dateObj);
  start.setHours(9, 0, 0, 0);
  const end = new Date(dateObj);
  end.setHours(12, 30, 0, 0);

  const slots = [];
  for (let t = start.getTime(); t < end.getTime(); t += avgConsultMins * 60000) {
    const dt = new Date(t);
    slots.push(timeLabel(dt));
  }
  return slots;
}





// GET /get-available-slots?department=Cardiology
// GET /get-available-slots?department=Cardiology
const pickDoctorForDay = require("../utils/pickDoctor");
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

exports.getAvailableSlots = async (req, res) => {
  try {
    if (!req.session.patientId) {
      return res.send("⚠ Please login as a patient to book slots.");
    }

    const { department } = req.query;
    if (!department) return res.send("❌ Please select a department.");

    const dept = department.trim();
    const today = new Date();

    const availableDays = [];

    for (let i = 1; i <= 7; i++) {
      const dayObj = addDays(today, i);
      const dayName = WEEKDAYS[dayObj.getDay()];
      const dateStr = toDateString(dayObj);

      // doctor for this day
    const doctors = await Doctor.find({ department: dept });


const leaves = await Leave.find({ date: dateStr });
const leaveSet = new Set(leaves.map(l => String(l.doctor)));

const availableDoctors = doctors.filter(
  d => !leaveSet.has(String(d._id))
);

let doctor = null;


if (availableDoctors.length > 0) {
  const dayNumber = new Date(dateStr).getDate();
  doctor = availableDoctors[dayNumber % availableDoctors.length];
} else {

  doctor = null;
}
   

     if (!doctor) {
  // show slots but no booking allowed
  availableDays.push({
    date: dateStr,
    dayName,
    doctor: {
      id: null,
      name: "No Doctor Assigned",
      department
    },
    slots: buildSlotsForDay(dayObj, 10).map(s => ({
      time: s,
      booked: true // disable booking
    }))
  });
  continue;
}


      // build slots
      let slots = buildSlotsForDay(dayObj, doctor.avgConsultTime || 10);

      // remove offline reserved
      slots = slots.filter((_, idx) => idx % 2 === 0);

      // get booked tokens
      const bookedTokens = await Token.find({
  date: dateStr,
  "doctor.id": doctor._id,
});
     
const bookedTimes = bookedTokens.map(t =>
  (t.timeSlot || t.estimatedTime || "").trim().toUpperCase()
);

      const slotStatus = slots.map(time => ({
        time,
        booked: bookedTimes.includes(time.trim().toUpperCase())
      }));

      availableDays.push({
        date: dateStr,
        dayName,
        doctor: {
          id: doctor._id? doctor._id.toString() : "",
          name: doctor.name,
          department: doctor.department
        },
        slots: slotStatus
      });
    }

    return res.render("availableSlots", {
      departmentName: dept,
      availableDays,
      patientId: req.session.patientId
    });

  } catch (err) {
    console.log("getAvailableSlots err:", err);
    return res.status(500).send("Server error");
  }
};



//configure node mailer
const transporter=nodemailer.createTransport({
  service:'gmail',
  auth:{
    user: process.env.EMAIL_USER ,
    pass: process.env.EMAIL_PASS
  }
})


// POST /book-token
// body { department, patientId, selectedDate, timeSlot, mode (Online/Offline), problem }
exports.bookToken = async (req, res) => {
  try {
    console.log('bookToken - body:', req.body);

    const { department, patientId, selectedDate, timeSlot, mode = 'Online', problem } = req.body;

    if (!department || !patientId || !selectedDate || !timeSlot) {
      return res.render('message', { msg: '⚠️ Missing required fields.' ,
  department: department || "General"});
    }

    const dept = department.trim();
    
if (!req.body.doctorId || req.body.doctorId.trim() === "") {
  return res.render('message', {
    msg: '❌ Doctor not available for this slot.',
    department: req.body.department || "General"
  });
}

    // find doctor case-insensitively
   // 🔥 Always pick correct doctor from hidden input
const doctor = await Doctor.findById(req.body.doctorId);

if (!doctor) {
  return res.render('message', { msg: '❌ Doctor not found.',
    department: department || "General"
   });
}


    // normalize date string to YYYY-MM-DD
    const selected = toDateString(selectedDate);
    const today = toDateString(new Date());
    const maxDay = toDateString(addDays(new Date(), 7));

    // allow booking only from tomorrow through next 7 days
    const tomorrow = toDateString(addDays(new Date(), 1));
    if (!(selected >= tomorrow && selected <= maxDay)) {
      return res.render('message', { msg: '⚠️ You can only book for tomorrow up to 7 days ahead.' ,
  department: department || "General"
      });
    }

    // ONLINE only allowed (we're enforcing online bookings only for future days per your policy)
    if (mode === 'Online' && selected === today) {
      return res.render('message', { msg: '⚠️ Same-day online booking is closed. Visit hospital for offline token.' ,
  department: department || "General"});
    }

    // check if slot already booked
    const existing = await Token.findOne({
      'doctor.id': doctor._id,
      date: selected,
      timeSlot
    });
    if (existing) return res.render('message', { msg: '🔴 This slot is already booked!',
  department: department || "General" });

    // quotas
    const totalTokens = await Token.countDocuments({ 'doctor.id': doctor._id, date: selected });
    const onlineTokens = await Token.countDocuments({ 'doctor.id': doctor._id, date: selected, mode: 'Online' });

    const offlineReserve = Math.floor((doctor.offlineReservePercent || 20) / 100 * doctor.maxPatientsPerDay);
    const onlineLimit = doctor.onlineBookingLimit || (doctor.maxPatientsPerDay - offlineReserve);

    if (mode === 'Online' && onlineTokens >= onlineLimit) {
      return res.render('message', { msg: '⚠️ Online slots full. Please visit hospital for offline OPD token.',
  department: department || "General" });
    }
    if (totalTokens >= doctor.maxPatientsPerDay) {
      return res.render('message', { msg: '⚠️ All slots (online + offline) are filled for this doctor.',
  department: department || "General" });
    }

    // Fetch the last token for this department and date
const lastToken = await Token.findOne({
  'doctor.department': doctor.department,
  date: selected
}).sort({ createdAt: -1 });


    const formattedSlot = timeSlot.trim().toUpperCase();

// Generate sequential token number based on time slot order
const allSlots = [
  "09:00 AM", "09:20 AM", "09:40 AM",
  "10:00 AM", "10:20 AM", "10:40 AM",
  "11:00 AM", "11:20 AM", "11:40 AM",
  "12:00 PM", "12:20 PM"
];

let tokenIndex = allSlots.findIndex(
  s => s.trim().toUpperCase() === formattedSlot
);

// Default to 1 if not found (just in case)
const nextNumber = tokenIndex !== -1 ? tokenIndex + 1 : 1;




// Define department-based token prefixes
const departmentPrefixes = {
  Cardiology: "C",
  Dermatology: "D",
  Orthopedics: "O",
  Neurology: "N",
  General: "G",
  Pediatrics: "P",
  ENT: "E",
  Ophthalmology: "OP"
};

const deptPrefix =
  departmentPrefixes[doctor.department] ||
  doctor.department.charAt(0).toUpperCase();

// ✅ Generate custom token like D1, C2, etc.
const customToken = `${deptPrefix}${nextNumber}`;


const newToken = await Token.create({
  tokenNumber: nextNumber,
  customToken, // 🔹 Add this field
  doctor: { id: doctor._id, name: doctor.name, department: doctor.department },
  patientId,
  date: selected,
  timeSlot,
  estimatedTime: timeSlot,
  mode,
  problem: problem || ''
});


//fetch patient data from database
const Patient=require('../databases/patients');
const patient=await Patient.findById(patientId);

console.log("✅ New Token Created:", newToken);


if(patient && patient.email){
  const mailOptions={from:'dobhaal070105@gmail.com',
to:patient.email,
subject:'Your OPD Token Confirmation - MediBridge',
html: `
      <h2>✅ OPD Token Generated Successfully!</h2>
      <p><b>Patient:</b> ${patient.name}</p>
      <p><b>Doctor:</b> ${doctor.name}</p>
      <p><b>Department:</b> ${doctor.department}</p>
      <p><b>Token Number:</b> ${newToken.customToken}</p>
      <p><b>Date:</b> ${selected}</p>
      <p><b>Time:</b> ${timeSlot}</p>
      <p><b>Mode:</b> ${mode}</p>
      <hr>
      <p>Thank you for booking with MediBridge! Please arrive 10 mins before your slot.</p>
    `,
    
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📩 Email sent to ${patient.email}`);
  } catch (emailErr) {
    console.error("❌ Failed to send email:", emailErr);
  }
}



    // ✅ Normalize slot format to uppercase for frontend consistency
const normalizedSlot = timeSlot.replace(/[: ]/g, '').toUpperCase();



// ✅ Notify all clients in real-time that this slot is now booked
const io = req.app.get('io');
if (io) {
  io.emit('slotBooked', {
    doctorId: doctor._id.toString(),
    date: selected,
    timeSlot: normalizedSlot
  });
}


    return res.render('message', {
      msg: `
        ✅ <b>OPD Token Generated Successfully!</b><br>
        Doctor: ${doctor.name}<br>
        Token No: ${newToken.customToken}<br>
        Date: ${selected}<br>
        Time: ${timeSlot}<br>
        Mode: ${mode}
      `,department: department
    });

  } catch (err) {
    console.error('Error booking token:', err);
    return res.render('message', { msg: '🚫 Failed to book token.',
      department: req.body.department || "General"
     });
  }
};