const express = require("express");
const router = express.Router();
const Medicine = require("../models/medicineModel");
const Alert = require("../models/alertModel");
const MedicineHistory = require("../models/medicineHistoryModel");



// ✅ GET: Show all medicines (Dashboard)
router.get("/all", async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ expiryDate: 1 });

    const alerts = await Alert.find().sort({ daysLeft: 1 }); // 👈 important

    res.render("medicines", { medicines, alerts });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading dashboard.");
  }
});

// ✅ GET: Add Medicine Page (Form Page)
router.get("/add", (req, res) => {
  res.render("addMedicine"); // ✅ separate form page, not medicines.ejs
});

// ✅ POST: Add new medicine
router.post("/add", async (req, res) => {
  try {
    await Medicine.create(req.body);
    res.redirect("/pharmacy/all"); // ✅ Redirect to dashboard after adding
  } catch (error) {
    console.error("Error adding medicine:", error);
    res.status(500).send("Failed to add medicine.");
  }
});

// ✅ GET: Edit Medicine Page
router.get("/edit/:id", async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).send("Medicine not found");
    res.render("editMedicine", { medicine });
  } catch (error) {
    console.error("Error loading edit page:", error);
    res.status(500).send("Error loading edit page.");
  }
});

// ✅ POST: Update Medicine (Form Submit)
router.post("/update/:id", async (req, res) => {
  try {
    const { name, batchNumber, expiryDate } = req.body;
    await Medicine.findByIdAndUpdate(req.params.id, {
      name,
      batchNumber,
      expiryDate,
    });
    res.redirect("/pharmacy/all");
  } catch (error) {
    console.error("Error updating medicine:", error);
    res.status(500).send("Error updating medicine.");
  }
});

// ✅ POST: Delete Medicine
// ✅ Delete Medicine (DELETE /api/medicines/delete/:id)
router.post("/delete/:id", async (req, res) => {
  try {
    const med = await Medicine.findById(req.params.id);

    if (!med) {
      return res.status(404).send("Medicine not found");
    }

    // 1️⃣ Pehle history me save karo
    await MedicineHistory.create({
      medicineId: med._id,
      name: med.name,
      batchNumber: med.batchNumber,
      quantity: med.quantity,
      manufactureDate: med.manufactureDate,
      expiryDate: med.expiryDate,
      supplier: med.supplier,
      statusAtDelete: "Expired / Removed",
      deleteReason: "Removed from stock", // yahan baad me UI se reason bhi bhej sakte ho
    });

    // 2️⃣ Fir actual medicines se delete karo
    await Medicine.findByIdAndDelete(req.params.id);

    // 3️⃣ Dashboard par wapas
    res.redirect("/pharmacy/all");
  } catch (error) {
    console.error("Error deleting medicine:", error);
    res.status(500).send("Error deleting medicine");
  }
});

// ✅ View deleted / expired medicines history
router.get("/history", async (req, res) => {
  try {
    const history = await MedicineHistory.find().sort({ deletedAt: -1 }); // latest first
    res.render("medicineHistory", { history });
  } catch (error) {
    console.error("Error loading history:", error);
    res.status(500).send("Error loading history");
  }
});

router.get("/notifications", async (req, res) => {
  const Alert = require("../models/alertModel");
  const alerts = await Alert.find().sort({ createdAt: -1 });
  res.render("notifications", { alerts });
});


module.exports = router;