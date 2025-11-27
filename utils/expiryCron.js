const cron = require("node-cron");
const Medicine = require("../models/medicineModel");
const Alert = require("../models/alertModel");

// 🔁 Every 1 minute (for testing)
cron.schedule("*/1 * * * *", async () => {
  console.log("⏳ [CRON] Running expiry check...");

  try {
    const medicines = await Medicine.find();
    const today = new Date();

    // ✅ For testing: clear all old alerts so we always see fresh ones
    await Alert.deleteMany({});
    console.log("🧹 [CRON] Cleared old alerts collection");

    for (const med of medicines) {
      const exp = new Date(med.expiryDate);
      const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));

      console.log(
        `🔍 [CRON] ${med.name} (batch ${med.batchNumber}) → diffDays = ${diffDays}`
      );

      // 👉 Only NEAR EXPIRY (0–30 days) for now
      if (diffDays >= 0 && diffDays <= 30) {
        const alertDoc = await Alert.create({
          medicine: med.name,
          batchNumber: med.batchNumber,
          daysLeft: diffDays,
        });

        console.log(
          `⚠️ [CRON] Alert CREATED for ${alertDoc.medicine} → ${alertDoc.daysLeft} days left`
        );
      }
    }

    console.log("✅ [CRON] Expiry check completed");
  } catch (err) {
    console.error("❌ [CRON] Error in expiryCron:", err);
  }
});

module.exports = {};
