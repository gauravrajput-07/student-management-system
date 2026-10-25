const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const Attendance = require("../models/attendance");
const Student = require("../models/student");


// Test Attendance Route


router.get("/test", (req, res) => {
    res.send("Attendance Route Working");
});


// Mark Attendance


router.post("/", async (req, res) => {
    try {
        const { studentId, date, status } = req.body;

        // Check all required fields
        if (!studentId || !date || !status) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        // Validate all student ID format
        if (!mongoose.isValidObjectId(studentId)) {
            return res.status(400).json({
                message: "Invalid student ID"
            });
        }

        // Validate status
        if (!["Present", "Absent"].includes(status)) {
            return res.status(400).json({
                message: "Status must be Present or Absent"
            });
        }

        // Validate date
        const attendanceDate = new Date(date);

        if (isNaN(attendanceDate.getTime())) {
            return res.status(400).json({
                message: "Invalid attendance date"
            });
        }

        // Normalize date to midnight UTC
        attendanceDate.setUTCHours(0, 0, 0, 0);

        // Check whether student exists
        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        // Check duplicate attendance
        const existingAttendance = await Attendance.findOne({
            studentId,
            date: attendanceDate
        });

        if (existingAttendance) {
            return res.status(400).json({
                message: "Attendance already marked for this date"
            });
        }

        // Create attendance record
        const attendance = new Attendance({
            studentId,
            date: attendanceDate,
            status
        });

        await attendance.save();

        res.status(201).json({
            message: "Attendance marked successfully",
            attendance
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Attendance already marked for this student on this date"
            });
        }

        res.status(500).json({
            message: error.message
        });
    }
});


// Get All Attendance Records


router.get("/", async (req, res) => {
    try {
        const attendanceRecords = await Attendance.find()
            .populate("studentId", "name rollNumber class section")
            .sort({ date: -1 });

        res.status(200).json({
            count: attendanceRecords.length,
            attendance: attendanceRecords
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});


// Get Attendance by Student ID


router.get("/student/:studentId", async (req, res) => {
    try {
        const { studentId } = req.params;

        // Validate student ID
        if (!mongoose.isValidObjectId(studentId)) {
            return res.status(400).json({
                message: "Invalid student ID"
            });
        }

        // Check whether student exists
        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        // Get attendance records for this student
        const attendanceRecords = await Attendance.find({
            studentId
        }).sort({ date: -1 });

        res.status(200).json({
            student: {
                _id: student._id,
                name: student.name,
                rollNumber: student.rollNumber,
                class: student.class,
                section: student.section
            },
            count: attendanceRecords.length,
            attendance: attendanceRecords
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});


// Update Attendance
// PUT /api/attendance/:id

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate attendance ID
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid attendance ID"
            });
        }

        // Validate status
        if (!["Present", "Absent"].includes(status)) {
            return res.status(400).json({
                message: "Status must be Present or Absent"
            });
        }

        // Find and update attendance
        const attendance = await Attendance.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!attendance) {
            return res.status(404).json({
                message: "Attendance record not found"
            });
        }

        res.status(200).json({
            message: "Attendance updated successfully",
            attendance
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});



// Delete Attendance


router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Validate attendance ID
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid attendance ID"
            });
        }

        // Find and delete attendance
        const attendance = await Attendance.findByIdAndDelete(id);

        if (!attendance) {
            return res.status(404).json({
                message: "Attendance record not found"
            });
        }

        res.status(200).json({
            message: "Attendance deleted successfully",
            attendance
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

module.exports = router;

