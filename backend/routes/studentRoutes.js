const express = require("express");
const router = express.Router();
const Student = require("../models/Student");


// Add Student (with no duplicate roll no is allowed)
router.post("/students", async (req, res) => {
  try {
    const { name, rollNumber, class: studentClass, section, age } = req.body;

    //  age must be positive
    if (age <= 0) {
      return res.status(400).json({
        message: "Age must be positive "
      });
    }

    // Check duplicate roll number
    const existingStudent = await Student.findOne({ rollNumber });

    if (existingStudent) {
      return res.status(400).json({
        message: "Roll number already exists"
      });
    }

    // Create new student
    const newStudent = new Student({
      name,
      rollNumber,
      class: studentClass,
      section,
      age
    });

    await newStudent.save();

    res.status(201).json(newStudent);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});


//  All Students
router.get("/students", async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// for Delete Student
router.delete("/students/:id", async (req, res) => {
  try {
    const deletedStudent = await Student.findByIdAndDelete(req.params.id);

    if (!deletedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ message: "Student deleted successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// for Update Student
router.put("/students/:id", async (req, res) => {
  try {
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(updatedStudent);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Student By ID
router.get("/students/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(student);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search Student by Name
router.get("/students/search/:name", async (req, res) => {
  try {
    const students = await Student.find({
      name: { $regex: req.params.name, $options: "i" }
    });

    res.status(200).json(students);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Search Student by Roll Number
router.get("/students/rollNumber/:rollNumber", async (req, res) => {
  try {
    const student = await Student.findOne({
      rollNumber: req.params.rollNumber
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    res.status(200).json(student);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});