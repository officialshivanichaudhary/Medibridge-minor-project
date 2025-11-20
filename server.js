const express = require("express");
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

app.use("/api/medicines", medicineRoutes);


//root route
app.get("/", async (req, res) => {
  const Medicine = require("./models/medicineModel");
  const Alert = require("./models/alertModel");

  const medicines = await Medicine.find().sort({ expiryDate: 1 });
  const alerts = await Alert.find().sort({ date: -1 });

  res.render("medicines", { medicines, alerts });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
