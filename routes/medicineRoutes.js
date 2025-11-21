const express = require("express");
const router = express.Router();
const Medicine = require("../models/medicineModel");
const Alert = require("../models/alertModel");


// ✅ GET: Show all medicines (Dashboard)
router.get("/all", async (req, res) => {
  try {
  const medicines = await Medicine.find().sort({ expiryDate: 1 });
  const alerts = await Alert.find().sort({ date: -1 });
  res.render("medicines", { medicines, alerts });
  } catch (error) {
    console.error("Error loading dashboard:", error);
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
    res.redirect("/api/medicines/all"); // ✅ Redirect to dashboard after adding
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
    res.redirect("/api/medicines/all");
  } catch (error) {
    console.error("Error updating medicine:", error);
    res.status(500).send("Error updating medicine.");
  }
});

// ✅ POST: Delete Medicine
router.post("/delete/:id", async (req, res) => {
  try {
    await Medicine.findByIdAndDelete(req.params.id);
    res.redirect("/api/medicines/all");
  } catch (error) {
    console.error("Error deleting medicine:", error);
    res.status(500).send("Error deleting medicine.");
  }
});


module.exports = router;
