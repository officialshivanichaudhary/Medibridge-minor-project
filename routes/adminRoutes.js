const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

function isAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) return next();
    res.redirect("/admin/login");
}

// Login routes
router.get("/login", adminController.adminLoginPage);
router.post("/login", adminController.adminLogin);

// Dashboard
router.get("/dashboard", isAdmin, adminController.adminDashboard);

// ❌ REMOVE OLD ROUTE (OVERWRITING ISSUE)
// router.post("/update-resources", isAdmin, adminController.updateResources);

// ✅ NEW — Hospital Resources Update
router.post("/update-hospital-resources", isAdmin, adminController.updateHospitalResources);

// ✅ NEW — Blood Stock Update
router.post("/update-blood-stock", isAdmin, adminController.updateBloodStock);

// Doctor management
router.get("/doctors", isAdmin, adminController.viewDoctors);
router.post("/add-doctor", isAdmin, adminController.addDoctor);
router.get("/delete-doctor/:id", isAdmin, adminController.deleteDoctor);
router.get("/edit-doctor/:id", isAdmin, adminController.editDoctorPage);
router.post("/edit-doctor/:id", isAdmin, adminController.updateDoctor);

router.get("/offline-tokens", isAdmin, adminController.viewAllOfflineTokens);

// Leave routes
router.get("/doctors/:id/leave", isAdmin, adminController.leaveForm);
router.post("/doctors/:id/leave", isAdmin, adminController.markLeave);

// Token route
router.post("/generate-offline-token", isAdmin, adminController.generateOfflineToken);

module.exports = router;
