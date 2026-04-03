// config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("URI:", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/medibridge", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
