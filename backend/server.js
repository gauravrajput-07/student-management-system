require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();


const studentRoutes = require("./routes/studentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");


app.use(cors());
app.use(express.json());


app.use("/api", studentRoutes);
app.use("/api/attendance", attendanceRoutes);


mongoose.connect(process.env.MONGODB_URI)
.then(() => {
console.log("MongoDB Connected");
})
.catch((error) => {
console.log("MongoDB Connection Error:", error);
});


app.get("/", (req, res) => {
res.send("Student Management Backend is Running");
});


const PORT = process.env.PORT || 5000;



app.listen(PORT, () => {
console.log(`Server is running on port ${PORT}`);
});
