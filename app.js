const express = require("express");
const app = express();
const session = require("express-session");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const path = require("path");
const cors = require("cors");

// DB connect
const connectDB = require("./config/db");
connectDB();

// HTTP + Socket.IO server
const server = http.createServer(app);
const io = new Server(server);
app.set("io", io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: "nishtha",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ----------------------------
// Original MediBridge Routes
// ----------------------------
const patientRoutes = require("./routes/patientRoutes");
const adminRoutes = require("./routes/adminRoutes");
const donorRoutes = require("./routes/donorRoutes");

app.use("/", patientRoutes);
app.use("/admin", adminRoutes);
app.use("/donor", donorRoutes);

// ----------------------------
// Pharmacy Panel Integration
// ----------------------------
const medicineRoutes = require("./routes/medicineRoutes");
require("./utils/expiryCron");

function requirePharmacyLogin(req, res, next) {
  if (req.session && req.session.pharmacyUser) return next();
  return res.redirect("/pharmacy/login");
}

// Pharmacy Login Page
app.get("/pharmacy/login", (req, res) => {
  if (req.session && req.session.pharmacyUser) return res.redirect("/pharmacy/all");
  res.render("pharmacyLogin", { error: null });
});

// Login Submit
const PHARMACY_EMAIL = process.env.PHARMACY_EMAIL;
const PHARMACY_PASSWORD = process.env.PHARMACY_PASSWORD;

app.post("/pharmacy/login", (req, res) => {
  const { email, password } = req.body;

  if (
    email === process.env.PHARMACY_EMAIL &&
    password === process.env.PHARMACY_PASSWORD
  ) {
    req.session.pharmacyUser = email;
    return res.redirect("/pharmacy/all");
  }

  res.render("pharmacyLogin", {
    error: "Invalid email or password"
  });
});

// Logout
app.get("/pharmacy/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/pharmacy/login"));
});

// Pharmacy Routes (Dashboard + CRUD)
app.use("/pharmacy", requirePharmacyLogin, medicineRoutes);
// ----------------------------

// Socket IO
io.on("connection", socket => {
  console.log("🟢 New client connected");
  socket.on("disconnect", () => console.log("🔴 Client disconnected"));
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`🚀 Server running & Pharmacy integrated successfully on Port ${PORT}`)
);
