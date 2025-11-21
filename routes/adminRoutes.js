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

// Update resources
router.post("/update-resources", isAdmin, adminController.updateResources);

// Doctor management
router.get("/doctors", isAdmin, adminController.viewDoctors);
router.post("/add-doctor", isAdmin, adminController.addDoctor);
router.get("/delete-doctor/:id", isAdmin, adminController.deleteDoctor);
router.get("/edit-doctor/:id", isAdmin, adminController.editDoctorPage);
router.post("/edit-doctor/:id", isAdmin, adminController.updateDoctor);
router.get("/offline-tokens", isAdmin, adminController.viewAllOfflineTokens);


// Leave & Tokens
router.post("/mark-leave", isAdmin, adminController.markLeave);
router.post("/generate-offline-token", isAdmin, adminController.generateOfflineToken);

module.exports = router;
