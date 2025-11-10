// controllers/patientController.js
const Doctor = require('../databases/Doctor');
const Token = require('../databases/Token');
const { addDays, format, addMinutes } = require('date-fns');
const nodemailer = require("nodemailer");

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
exports.getAvailableSlots = async (req, res) => {
  try {
    const { department } = req.query;
    if (!department) return res.send('❌ Please select a department.');

    const dept = department.trim();
    console.log('getAvailableSlots - department received:', JSON.stringify(dept));

    // find doctor case-insensitively
    const doctor = await Doctor.findOne({
      department: { $regex: new RegExp(`^${dept}$`, 'i') }
    });

    if (!doctor) {
      console.log('getAvailableSlots - doctor not found for:', dept);
      return res.send('❌ Doctor not found.');
    }

    const availableDays = [];
    const today = new Date();

    // For next 7 days
    for (let i = 1; i <= 7; i++) {
      const dayObj = addDays(today, i);
      const dateStr = toDateString(dayObj);

      // generate all slots (9:00–12:30)
      let slots = buildSlotsForDay(dayObj, doctor.avgConsultTime || 10);

      // ❌ Remove offline reserved (every alternate slot)
      slots = slots.filter((_, index) => index % 2 === 0);

// create slot → token map (like D1, D2, D3...)
const deptPrefix = doctor.department[0].toUpperCase(); // e.g. Dermatology -> D
const slotTokenMap = {};
slots.forEach((slot, index) => {
  slotTokenMap[slot.trim().toUpperCase()] = `${deptPrefix}${index + 1}`;
});




      // find booked tokens for this doctor + date
      const bookedTokens = await Token.find({ 'doctor.id': doctor._id, date: dateStr });
const bookedTimes = bookedTokens
  .filter(t => t.timeSlot || t.estimatedTime)
  .map(t => (t.timeSlot || t.estimatedTime).trim().toUpperCase());


const slotStatus = slots.map(slot => ({
  time: slot,
  booked: bookedTimes.includes(slot.trim().toUpperCase())
}));

      availableDays.push({
        date: dateStr,
        slots: slotStatus
      });
    }

    // Render page
    return res.render('availableSlots', {
      doctor,
      availableDays,
      patientId: req.session.patientId || null
    });

  } catch (err) {
    console.error('Error fetching slots:', err);
    return res.status(500).send('🚫 Failed to load available slots.');
  }
};

//configure node mailer
const transporter=nodemailer.createTransport({
  service:'gmail',
  auth:{
    user:'dobhaal2005@gmail.com',
    pass:'eqrp bivz btry chjm'
  }
})


// POST /book-token
// body { department, patientId, selectedDate, timeSlot, mode (Online/Offline), problem }
exports.bookToken = async (req, res) => {
  try {
    console.log('bookToken - body:', req.body);

    const { department, patientId, selectedDate, timeSlot, mode = 'Online', problem } = req.body;

    if (!department || !patientId || !selectedDate || !timeSlot) {
      return res.render('message', { msg: '⚠️ Missing required fields.' });
    }

    const dept = department.trim();

    // find doctor case-insensitively
    const doctor = await Doctor.findOne({
      department: { $regex: new RegExp(`^${dept}$`, 'i') }
    });
    if (!doctor) {
      console.log('bookToken - doctor not found for:', dept);
      return res.render('message', { msg: '❌ Doctor not found.' });
    }

    // normalize date string to YYYY-MM-DD
    const selected = toDateString(selectedDate);
    const today = toDateString(new Date());
    const maxDay = toDateString(addDays(new Date(), 7));

    // allow booking only from tomorrow through next 7 days
    const tomorrow = toDateString(addDays(new Date(), 1));
    if (!(selected >= tomorrow && selected <= maxDay)) {
      return res.render('message', { msg: '⚠️ You can only book for tomorrow up to 7 days ahead.' });
    }

    // ONLINE only allowed (we're enforcing online bookings only for future days per your policy)
    if (mode === 'Online' && selected === today) {
      return res.render('message', { msg: '⚠️ Same-day online booking is closed. Visit hospital for offline token.' });
    }

    // check if slot already booked
    const existing = await Token.findOne({
      'doctor.id': doctor._id,
      date: selected,
      timeSlot
    });
    if (existing) return res.render('message', { msg: '🔴 This slot is already booked!' });

    // quotas
    const totalTokens = await Token.countDocuments({ 'doctor.id': doctor._id, date: selected });
    const onlineTokens = await Token.countDocuments({ 'doctor.id': doctor._id, date: selected, mode: 'Online' });

    const offlineReserve = Math.floor((doctor.offlineReservePercent || 20) / 100 * doctor.maxPatientsPerDay);
    const onlineLimit = doctor.onlineBookingLimit || (doctor.maxPatientsPerDay - offlineReserve);

    if (mode === 'Online' && onlineTokens >= onlineLimit) {
      return res.render('message', { msg: '⚠️ Online slots full. Please visit hospital for offline OPD token.' });
    }
    if (totalTokens >= doctor.maxPatientsPerDay) {
      return res.render('message', { msg: '⚠️ All slots (online + offline) are filled for this doctor.' });
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
  const mailOptions={from:'dobhaal2005@gmail.com',
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
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📩 Email sent to ${patient.email}`);
  } catch (emailErr) {
    console.error("❌ Failed to send email:", emailErr);
  }
}



    // ✅ Normalize slot format to uppercase for frontend consistency
const normalizedSlot = timeSlot.toUpperCase();

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
        Token No: ${newToken.tokenNumber}<br>
        Date: ${selected}<br>
        Time: ${timeSlot}<br>
        Mode: ${mode}
      `
    });

  } catch (err) {
    console.error('Error booking token:', err);
    return res.render('message', { msg: '🚫 Failed to book token.' });
  }
};
