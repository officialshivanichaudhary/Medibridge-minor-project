const Doctor = require("../databases/Doctor");
const Leave = require("../databases/Leave");

module.exports = async function pickDoctorForDay(department, dayName, dateStr) {
  try {
    // 1️⃣ All doctors of department (stable order)
    const doctors = await Doctor.find({ department }).sort({ createdAt: 1 });
    if (!doctors.length) return null;

    // 2️⃣ OPD doctors for this weekday
    
    const opdDoctors = doctors; // 🔥 ignore opdDays
    if (!opdDoctors.length) return null;

    // 3️⃣ Leaves for this date (single query)
    const leaves = await Leave.find({
      doctor: { $in: opdDoctors.map(d => d._id) }
    });

const leaveSet = new Set(
  leaves.map(l => String(l.doctor))
);

console.log("All doctors:", opdDoctors.map(d => d.name));
console.log("Leaves:", leaves);
console.log("LeaveSet:", leaveSet);

const available = opdDoctors.filter(
  d => !leaveSet.has(String(d._id))
);

// ✅ normal case
if (available.length > 0) {
  const dayNumber = new Date(dateStr).getDate();
  return available[dayNumber % available.length];
}

// 🔥 ONLY if ALL opd doctors on leave
const fallbackDoctors = doctors.filter(
  d => !leaveSet.has(String(d._id))
);

if (fallbackDoctors.length > 0) {
  return fallbackDoctors[0];
}

return null;

    // 5️⃣ 🔥 ROTATION LOGIC (KEY FIX)
    const dayNumber = new Date(dateStr).getDate(); // 1–31
    const index = dayNumber % available.length;

    return available[index];

  } catch (err) {
    console.error("pickDoctorForDay error:", err);
    return null;
  }
};