const express = require("express");
const app = express();
const session = require("express-session");
const http = require("http");
const { Server } = require("socket.io"); // ✅ Added import

// ✅ Create an HTTP server for both Express + Socket.IO
const server = http.createServer(app);
const io = new Server(server);

// ✅ Make io available inside controllers
app.set("io", io);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "nishtha",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // session valid for 1 day
    },
  })
);

app.set("view engine", "ejs");

// Routes
const patientRoutes = require("./routes/patientRoutes");

// Use routes
app.use("/", patientRoutes);

// ✅ socket listener (optional log)
io.on('connection', socket => {
  console.log("🟢 New client connected");
  socket.on('disconnect', () => console.log("🔴 Client disconnected"));
});

// ✅ Start the server (must use `server.listen` for Socket.IO)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
