const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// 👉 Paste it HERE (below other require lines)
const studentRoutes = require("./routes/studentRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 👉 Add this line BELOW middleware
app.use("/api", studentRoutes);

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

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});