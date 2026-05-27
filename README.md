# MediBridge 🏥

MediBridge is a full-stack healthcare management web application designed to simplify hospital operations such as OPD token booking, doctor management, blood bank alerts, pharmacy inventory tracking, and emergency doctor reassignment.

The platform provides separate modules for patients, admins, doctors, and pharmacy management with automated email notifications and real-time slot handling.

---

# 🚀 Features

## 👨‍⚕️ Patient Module
- OPD token booking system
- Department-wise slot booking
- Online & Offline appointment modes
- Real-time slot availability
- Automated email confirmation after booking
- Doctor reassignment notifications during emergency leaves

---

## 🩺 Doctor Management
- Department-wise doctor allocation
- OPD day scheduling
- Emergency leave management
- Automatic doctor reassignment system
- Rotation-based reassignment logic

---

## 🩸 Blood Bank Module
- Blood stock monitoring
- Low blood stock alerts
- Automated donor email notifications
- Blood group-wise inventory management

---

## 💊 Pharmacy Module
- Medicine inventory management
- Expiry date tracking
- Automated expiry alerts
- Pharmacy dashboard access

---

## 🔐 Admin Panel
- Manage doctors
- Manage appointments
- Monitor blood stock
- Track pharmacy inventory
- Handle emergency doctor leaves
- View hospital operations centrally

---

# 🛠️ Tech Stack

## Frontend
- HTML
- CSS
- Bootstrap
- JavaScript
- EJS

## Backend
- Node.js
- Express.js

## Database
- MongoDB Atlas
- Mongoose

## Other Tools & Services
- Nodemailer
- Render
- GitHub
- Cron Jobs

---

# ⚙️ Key Functionalities

## ✅ Smart Doctor Reassignment
If a doctor takes emergency leave after appointments are already booked:
- Patients automatically get reassigned to another available doctor
- Existing booked slots remain reserved
- Patients receive reassignment emails
- New bookings display the updated doctor automatically

---

## ✅ Automated Email Notifications
The system sends emails for:
- OPD token confirmation
- Doctor reassignment
- Blood donation requests
- Inventory alerts

---

# 🌐 Live Demo

https://medibridge-snop.onrender.com

---

---

# 👩‍💻 Developed By

## 🔹 Admin & Patient Panel
Developed by **Nishtha Dobhaal**

## 🔹 Pharmacy Module
Developed by **Shivani Chaudhary**
