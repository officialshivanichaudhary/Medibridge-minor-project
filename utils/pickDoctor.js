const Doctor = require("../databases/Doctor");
const Leave = require("../databases/Leave");

module.exports = async function pickDoctorForDay(department, dayName, dateStr) {
  try {
    // 1️⃣ All doctors of department (stable order)
    const doctors = await Doctor.find({ department }).sort({ createdAt: 1 });
    if (!doctors.length) return null;

    // 2️⃣ OPD doctors for this weekday
    const opdDoctors = doctors.filter(d =>
      Array.isArray(d.opdDays) && d.opdDays.includes(dayName)
    );
    if (!opdDoctors.length) return null;

    // 3️⃣ Leaves for this date (single query)
    const leaves = await Leave.find({
      doctor: { $in: opdDoctors.map(d => d._id) },
      date: dateStr
    });

    const leaveSet = new Set(leaves.map(l => l.doctor.toString()));

    // 4️⃣ Available doctors (not on leave)
    const available = opdDoctors.filter(
      d => !leaveSet.has(d._id.toString())
    );
    if (!available.length) return null;

    // 5️⃣ 🔥 ROTATION LOGIC (KEY FIX)
    const dayNumber = new Date(dateStr).getDate(); // 1–31
    const index = dayNumber % available.length;

    return available[index];

  } catch (err) {
    console.error("pickDoctorForDay error:", err);
    return null;
  }
};
