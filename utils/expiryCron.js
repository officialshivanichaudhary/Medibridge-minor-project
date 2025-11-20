const cron = require("node-cron");
const Medicine = require("../models/medicineModel");
const Alert = require("../models/alertModel");

// Run every 1 minute (for testing)
cron.schedule("*/1 * * * *", async () => {
  console.log("⏳ Checking medicine expiry...");

  const medicines = await Medicine.find();
  const today = new Date();

  for (let med of medicines) {
    const exp = new Date(med.expiryDate);
    const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));

    // ✅ DO NOT create duplicate alerts
    const exists = await Alert.findOne({
      medicine: med.name,
      batchNumber: med.batchNumber
    });

    if (!exists && diffDays <= 30) {
      await Alert.create({
        medicine: med.name,
        batchNumber: med.batchNumber,
        daysLeft: diffDays < 0 ? 0 : diffDays
      });

      console.log(`⚠️ Alert Created → ${med.name} | Expiry in ${diffDays} days`);
    }
  }
});

module.exports = {};
