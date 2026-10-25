
const API_URL = "http://localhost:5000/api/students";
const ATTENDANCE_URL = "http://localhost:5000/api/attendance";

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Read API response safely
async function readResponse(response) {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.message || `Request failed: ${response.status}`
        );
    }

    return data;
}

// Show success or error message
function showAttendanceMessage(message, isError = false) {
    const messageElement = document.getElementById("attendanceMessage");

    if (messageElement) {
        messageElement.textContent = message;
        messageElement.style.color = isError ? "red" : "green";
    }
}

// Get student ID from an attendance record
function getStudentId(record) {
    const student = record.studentId;

    if (student && typeof student === "object") {
        return student._id || student.id || null;
    }

    return student || null;
}

// Load students into the dropdown
async function loadStudentOptions() {
    const select = document.getElementById("attendanceStudent");

    try {
        const response = await fetch(`${API_URL}?page=1&limit=1000`);
        const result = await readResponse(response);

        const students = Array.isArray(result)
            ? result
            : result.students || [];

        select.innerHTML = '<option value="">Select Student</option>';

        students.forEach(student => {
            const option = document.createElement("option");

            option.value = student._id;
            option.textContent =
                `${student.name} (Roll: ${student.rollNumber || "-"})`;

            select.appendChild(option);
        });

        if (students.length === 0) {
            select.innerHTML =
                '<option value="">No students found</option>';
        }

    } catch (error) {
        console.error("Error loading students:", error);

        select.innerHTML =
            '<option value="">Unable to load students</option>';

        showAttendanceMessage(error.message, true);
    }
}

// Load total student count
async function updateTotalStudents() {
    try {
        const response = await fetch(`${API_URL}/count`);
        const result = await readResponse(response);

        document.getElementById("totalStudents").textContent =
            result.totalStudents ?? 0;

    } catch (error) {
        console.error("Error loading student count:", error);
    }
}

// Mark attendance
document.getElementById("attendanceForm").addEventListener(
    "submit",
    async function (event) {
        event.preventDefault();

        const studentId =
            document.getElementById("attendanceStudent").value;

        const date =
            document.getElementById("attendanceDate").value;

        const status =
            document.getElementById("attendanceStatus").value;

        if (!studentId || !date || !status) {
            showAttendanceMessage(
                "Please select a student, date and status.",
                true
            );
            return;
        }

        try {
            const response = await fetch(ATTENDANCE_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    studentId,
                    date,
                    status
                })
            });

            await readResponse(response);

            showAttendanceMessage("Attendance marked successfully!");

            document.getElementById("attendanceStatus").value = "";

            await loadAttendance();
            await loadAttendancePercentages();

        } catch (error) {
            showAttendanceMessage(error.message, true);
        }
    }
);

// Load all attendance records
async function loadAttendance() {
    try {
        const response = await fetch(ATTENDANCE_URL);
        const result = await readResponse(response);

        const records = Array.isArray(result)
            ? result
            : result.attendance || [];

        renderAttendanceTable(records);
        updateAttendanceDashboard(records);

        await loadAttendancePercentages();

    } catch (error) {
        console.error("Error loading attendance:", error);

        document.getElementById("attendanceTable").innerHTML =
            `<tr><td colspan="6">Unable to load attendance records.</td></tr>`;

        showAttendanceMessage(error.message, true);
    }
}

// Update dashboard numbers
function updateAttendanceDashboard(records) {
    const total = records.length;

    const present = records.filter(
        record => record.status === "Present"
    ).length;

    const absent = records.filter(
        record => record.status === "Absent"
    ).length;

    document.getElementById("totalAttendance").textContent = total;
    document.getElementById("totalPresent").textContent = present;
    document.getElementById("totalAbsent").textContent = absent;
}

// Display attendance records
function renderAttendanceTable(records) {
    const table = document.getElementById("attendanceTable");

    if (!records.length) {
        table.innerHTML = `
            <tr>
                <td colspan="6">No attendance records found.</td>
            </tr>
        `;
        return;
    }

    table.innerHTML = "";

    records.forEach(record => {
        const student =
            record.studentId && typeof record.studentId === "object"
                ? record.studentId
                : null;

        const studentName = student?.name || "Student details unavailable";
        const rollNumber = student?.rollNumber || "-";
        const studentClass = student?.class || "-";

        const date = record.date
            ? new Date(record.date).toLocaleDateString("en-GB", {
                timeZone: "UTC"
            })
            : "-";

        const row = document.createElement("tr");

        const values = [
            studentName,
            rollNumber,
            studentClass,
            date,
            record.status || "-"
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const actionsCell = document.createElement("td");

        const toggleButton = document.createElement("button");
        toggleButton.textContent = "Toggle Status";
        toggleButton.type = "button";

        toggleButton.addEventListener("click", () => {
            const newStatus =
                record.status === "Present" ? "Absent" : "Present";

            updateAttendance(record._id, newStatus);
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.type = "button";

        deleteButton.addEventListener("click", () => {
            deleteAttendance(record._id);
        });

        actionsCell.appendChild(toggleButton);
        actionsCell.appendChild(deleteButton);
        row.appendChild(actionsCell);

        table.appendChild(row);
    });
}

// Filter attendance by selected date
async function filterAttendanceByDate() {
    const date =
        document.getElementById("filterAttendanceDate").value;

    if (!date) {
        showAttendanceMessage("Please select a date to filter.", true);
        return;
    }

    try {
        const response = await fetch(
            `${ATTENDANCE_URL}?date=${encodeURIComponent(date)}`
        );

        const result = await readResponse(response);

        const records = Array.isArray(result)
            ? result
            : result.attendance || [];

        renderAttendanceTable(records);
        updateAttendanceDashboard(records);

        showAttendanceMessage(`Showing attendance for ${date}.`);

    } catch (error) {
        showAttendanceMessage(error.message, true);
    }
}

// Clear date filter and show all attendance
async function clearAttendanceDateFilter() {
    document.getElementById("filterAttendanceDate").value = "";
    await loadAttendance();
}

// View attendance history for selected student
async function loadSelectedStudentAttendance() {
    const studentId =
        document.getElementById("attendanceStudent").value;

    if (!studentId) {
        showAttendanceMessage("Please select a student first.", true);
        return;
    }

    try {
        const response = await fetch(
            `${ATTENDANCE_URL}/student/${encodeURIComponent(studentId)}`
        );

        const result = await readResponse(response);
        const records = result.attendance || [];

        renderAttendanceTable(records);
        updateAttendanceDashboard(records);

        const studentName =
            result.student?.name ||
            document.getElementById("attendanceStudent")
                .selectedOptions[0]?.textContent ||
            "Selected student";

        showAttendanceMessage(
            `Showing attendance history for ${studentName}.`
        );

    } catch (error) {
        showAttendanceMessage(error.message, true);
    }
}

// Update attendance status
async function updateAttendance(id, status) {
    try {
        const response = await fetch(`${ATTENDANCE_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status })
        });

        await readResponse(response);

        showAttendanceMessage("Attendance status updated successfully.");

        await loadAttendance();

    } catch (error) {
        showAttendanceMessage(error.message, true);
    }
}

// Delete attendance record
async function deleteAttendance(id) {
    if (!confirm("Are you sure you want to delete this attendance record?")) {
        return;
    }

    try {
        const response = await fetch(`${ATTENDANCE_URL}/${id}`, {
            method: "DELETE"
        });

        await readResponse(response);

        showAttendanceMessage("Attendance record deleted successfully.");

        await loadAttendance();

    } catch (error) {
        showAttendanceMessage(error.message, true);
    }
}

// Calculate attendance percentage for every student
async function loadAttendancePercentages() {
    const table =
        document.getElementById("attendancePercentageTable");

    if (!table) return;

    try {
        const [studentsResponse, attendanceResponse] = await Promise.all([
            fetch(`${API_URL}?page=1&limit=1000`),
            fetch(ATTENDANCE_URL)
        ]);

        const studentsResult = await readResponse(studentsResponse);
        const attendanceResult = await readResponse(attendanceResponse);

        const students = Array.isArray(studentsResult)
            ? studentsResult
            : studentsResult.students || [];

        const records = Array.isArray(attendanceResult)
            ? attendanceResult
            : attendanceResult.attendance || [];

        if (!students.length) {
            table.innerHTML = `
                <tr>
                    <td colspan="6">No students found.</td>
                </tr>
            `;
            return;
        }

        table.innerHTML = "";

        students.forEach(student => {
            const studentRecords = records.filter(record => {
                return String(getStudentId(record)) === String(student._id);
            });

            const present = studentRecords.filter(
                record => record.status === "Present"
            ).length;

            const absent = studentRecords.filter(
                record => record.status === "Absent"
            ).length;

            const total = present + absent;

            const percentage = total > 0
                ? `${((present / total) * 100).toFixed(2)}%`
                : "N/A";

            const row = document.createElement("tr");

            [
                student.name || "-",
                student.rollNumber || "-",
                total,
                present,
                absent,
                percentage
            ].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            table.appendChild(row);
        });

    } catch (error) {
        console.error("Attendance percentage error:", error);

        table.innerHTML = `
            <tr>
                <td colspan="6">
                    Unable to load attendance percentages.
                    Check the browser console and backend.
                </td>
            </tr>
        `;
    }
}

// Initialize attendance page
async function initializeAttendancePage() {
    const attendanceDate = document.getElementById("attendanceDate");

    if (attendanceDate && !attendanceDate.value) {
        attendanceDate.value = getTodayDate();
    }

    await Promise.all([
        loadStudentOptions(),
        updateTotalStudents(),
        loadAttendance()
    ]);
}

// Make functions available to HTML buttons
window.loadAttendance = loadAttendance;
window.filterAttendanceByDate = filterAttendanceByDate;
window.clearAttendanceDateFilter = clearAttendanceDateFilter;
window.loadSelectedStudentAttendance = loadSelectedStudentAttendance;
window.updateAttendance = updateAttendance;
window.deleteAttendance = deleteAttendance;
window.loadAttendancePercentages = loadAttendancePercentages;

// Start the page
initializeAttendancePage();
