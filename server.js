const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const connectDB = require("./config/db");
const medicineRoutes = require("./routes/medicineRoutes");
require("./utils/expiryCron");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// EJS Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// 🔐 Session setup (login ke liye)
app.use(
  session({
    secret: "medibridge_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// 🔐 Simple auth middleware
function requireLogin(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect("/login");
}

// 🔐 Hardcoded pharmacy login credentials
const ADMIN_EMAIL = "pharmacy@gmail.com";
const ADMIN_PASSWORD = "123456";

// 🧑‍⚕️ GET: Login page
app.get("/login", (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect("/");
  }
  res.render("login", { error: null });
});

// 🧑‍⚕️ POST: Login submit
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    req.session.user = email; // login successful
    return res.redirect("/");
  }

  // wrong credentials
  return res.render("login", { error: "Invalid email or password" });
});

// 🔓 Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// ✅ Pharmacy routes protected by login
app.use("/api/medicines", requireLogin, medicineRoutes);

// ✅ Root dashboard route (also protected)
app.get("/", requireLogin, async (req, res) => {
  const Medicine = require("./models/medicineModel");
  const Alert = require("./models/alertModel");

  const medicines = await Medicine.find().sort({ expiryDate: 1 });
  const alerts = await Alert.find().sort({ date: -1 });

  res.render("medicines", { medicines, alerts });
});
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
