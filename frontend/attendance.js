const API_URL = "http://localhost:5000/api/students";
const ATTENDANCE_URL = "http://localhost:5000/api/attendance";

// ========================================
// INITIALIZE PAGE
// ========================================

document.addEventListener("DOMContentLoaded", function () {
document.getElementById("attendanceDate").value = getTodayDate();

loadStudentOptions();
loadAttendance();

document.getElementById("attendanceForm").addEventListener(
    "submit",
    markAttendance
);

});

// ========================================
// GET TODAY'S DATE
// ========================================

function getTodayDate() {
const today = new Date();

const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, "0");
const day = String(today.getDate()).padStart(2, "0");

return year + "-" + month + "-" + day;

}

// ========================================
// HANDLE API RESPONSES
// ========================================

async function readResponse(response) {
const data = await response.json().catch(function () {
return {};
});

if (!response.ok) {
    throw new Error(data.message || "Request failed: " + response.status);
}

return data;

}

// ========================================
// LOAD STUDENTS INTO DROPDOWN
// ========================================

async function loadStudentOptions() {
const dropdown = document.getElementById("attendanceStudent");

try {
    const response = await fetch(API_URL);
    const result = await readResponse(response);

    const students = Array.isArray(result)
        ? result
        : (result.students || []);

    dropdown.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "-- Select Student --";
    dropdown.appendChild(defaultOption);

    students.forEach(function (student) {
        const option = document.createElement("option");

        option.value = student._id;
        option.textContent =
            student.name + " (Roll: " + student.rollNumber + ")";

        dropdown.appendChild(option);
    });

    if (students.length === 0) {
        showMessage("No students found. Add students on the Student Management page.", true);
    }

} catch (error) {
    console.error("Load Students Error:", error);

    dropdown.innerHTML = '<option value="">Unable to load students</option>';

    showMessage("Unable to load students. Check that your backend is running.", true);
}

}

// ========================================
// MARK ATTENDANCE
// ========================================

async function markAttendance(event) {
event.preventDefault();

const studentId = document.getElementById("attendanceStudent").value;
const date = document.getElementById("attendanceDate").value;
const status = document.getElementById("attendanceStatus").value;

if (!studentId || !date || !status) {
    showMessage("Please select a student, date, and status.", true);
    return;
}

try {
    const response = await fetch(ATTENDANCE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            studentId: studentId,
            date: date,
            status: status
        })
    });

    const data = await readResponse(response);

    showMessage(data.message || "Attendance marked successfully.");

    await loadAttendance();

} catch (error) {
    console.error("Mark Attendance Error:", error);

    showMessage(error.message || "Unable to mark attendance.", true);
}

}

// ========================================
// LOAD ALL ATTENDANCE
// ========================================

async function loadAttendance() {
try {
const response = await fetch(ATTENDANCE_URL);
const result = await readResponse(response);

    const records = Array.isArray(result)
        ? result
        : (result.attendance || []);

    renderAttendanceTable(records);
    updateDashboard(records);

} catch (error) {
    console.error("Load Attendance Error:", error);

    showMessage("Unable to load attendance records. Check your backend.", true);
}

}

// ========================================
// UPDATE DASHBOARD
// ========================================

function updateDashboard(records) {
const presentCount = records.filter(function (record) {
return record.status === "Present";
}).length;

const absentCount = records.filter(function (record) {
    return record.status === "Absent";
}).length;

document.getElementById("totalAttendance").textContent = records.length;
document.getElementById("totalPresent").textContent = presentCount;
document.getElementById("totalAbsent").textContent = absentCount;

}

// ========================================
// DISPLAY ATTENDANCE TABLE
// ========================================

function renderAttendanceTable(records) {
const table = document.getElementById("attendanceTable");

table.innerHTML = "";

if (records.length === 0) {
    table.innerHTML =
        '<tr><td colspan="6">No attendance records found.</td></tr>';
    return;
}

records.forEach(function (record) {
    const row = document.createElement("tr");

    const student = record.studentId &&
        typeof record.studentId === "object"
        ? record.studentId
        : {};

    const name = student.name || "Student unavailable";
    const rollNumber = student.rollNumber || "-";
    const studentClass = student.class || "-";

    const date = record.date
        ? new Date(record.date).toLocaleDateString()
        : "-";

    addCell(row, name);
    addCell(row, rollNumber);
    addCell(row, studentClass);
    addCell(row, date);

    const statusCell = document.createElement("td");
    statusCell.textContent = record.status || "-";

    if (record.status === "Present") {
        statusCell.className = "status-present";
    } else if (record.status === "Absent") {
        statusCell.className = "status-absent";
    }

    row.appendChild(statusCell);

    const actionCell = document.createElement("td");

    const updateButton = document.createElement("button");
    updateButton.type = "button";
    updateButton.textContent = "Change Status";

    updateButton.addEventListener("click", function () {
        const newStatus = record.status === "Present"
            ? "Absent"
            : "Present";

        updateAttendance(record._id, newStatus);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", function () {
        deleteAttendance(record._id);
    });

    actionCell.appendChild(updateButton);
    actionCell.appendChild(deleteButton);

    row.appendChild(actionCell);
    table.appendChild(row);
});

}

// ========================================
// CREATE TABLE CELL
// ========================================

function addCell(row, value) {
const cell = document.createElement("td");

cell.textContent = value === undefined || value === null
    ? "-"
    : value;

row.appendChild(cell);

}

// ========================================
// UPDATE ATTENDANCE STATUS
// ========================================

async function updateAttendance(id, status) {
const confirmed = confirm("Change attendance status to " + status + "?");

if (!confirmed) {
    return;
}

try {
    const response = await fetch(ATTENDANCE_URL + "/" + id, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            status: status
        })
    });

    const data = await readResponse(response);

    showMessage(data.message || "Attendance updated successfully.");

    await loadAttendance();

} catch (error) {
    console.error("Update Attendance Error:", error);

    showMessage(error.message || "Unable to update attendance.", true);
}

}

// ========================================
// DELETE ATTENDANCE
// ========================================

async function deleteAttendance(id) {
const confirmed = confirm(
"Are you sure you want to delete this attendance record?"
);

if (!confirmed) {
    return;
}

try {
    const response = await fetch(ATTENDANCE_URL + "/" + id, {
        method: "DELETE"
    });

    const data = await readResponse(response);

    showMessage(data.message || "Attendance deleted successfully.");

    await loadAttendance();

} catch (error) {
    console.error("Delete Attendance Error:", error);

    showMessage(error.message || "Unable to delete attendance.", true);
}

}

// ========================================
// VIEW SELECTED STUDENT HISTORY
// ========================================

async function loadSelectedStudentAttendance() {
const studentId = document.getElementById("attendanceStudent").value;

if (!studentId) {
    showMessage("Please select a student first.", true);
    return;
}

try {
    const url = ATTENDANCE_URL + "/student/" + studentId;
    const response = await fetch(url);
    const result = await readResponse(response);

    const records = Array.isArray(result)
        ? result
        : (result.attendance || []);

    renderAttendanceTable(records);
    updateDashboard(records);

    const studentName = result.student && result.student.name
        ? result.student.name
        : "selected student";

    showMessage("Showing attendance history for " + studentName + ".");

} catch (error) {
    console.error("Student Attendance Error:", error);

    showMessage(error.message || "Unable to load student history.", true);
}

}

// ========================================
// DISPLAY MESSAGES
// ========================================

function showMessage(message, isError) {
const element = document.getElementById("attendanceMessage");

element.textContent = message;
element.style.color = isError ? "#d62828" : "#16803c";

}