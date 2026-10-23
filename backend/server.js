const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Import Routes
const studentRoutes = require("./routes/studentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", studentRoutes);
app.use("/api/attendance", attendanceRoutes);

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/studentDB")
.then(() => {
console.log("MongoDB Connected");
})
.catch((error) => {
console.log("MongoDB Connection Error:", error);
});

// Test Route
app.get("/", (req, res) => {
res.send("Student Management Backend is Running");
});

// Server
const PORT = 5000;

app.listen(PORT, () => {
console.log(`Server is running on port ${PORT}`);
});
