const Doctor = require("../databases/Doctor");
const Leave = require("../databases/Leave");

module.exports = async function pickDoctorForDay(department, dayName, dateStr) {
  try {
    // 1️⃣ Find all doctors of that department
    const doctors = await Doctor.find({ department });

    if (!doctors || doctors.length === 0) return null;

    // 2️⃣ Filter doctors who actually have OPD on this day
    let availableDoctors = doctors.filter(d =>
      Array.isArray(d.opdDays) && d.opdDays.includes(dayName)
    );

    if (availableDoctors.length === 0) {
      // No OPD doctor for this day → no doctor assigned
      return null;
    }

    // 3️⃣ Remove doctors who are on leave on this date
    const finalDoctors = [];

    for (let doc of availableDoctors) {
      const onLeave = await Leave.exists({ doctor: doc._id, date: dateStr });

      if (!onLeave) {
        finalDoctors.push(doc);
      }
    }

    // 4️⃣ If at least one doctor is available → pick the first one
    if (finalDoctors.length > 0) return finalDoctors[0];

    // 5️⃣ All OPD doctors are on leave → pick any doctor of same dept (alternate)
    const alternate = doctors[0];
    return alternate || null;

  } catch (err) {
    console.log("pickDoctor error:", err);
    return null;
  }
};
