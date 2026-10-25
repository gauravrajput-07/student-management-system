
// API CONFIGURATION


const API_URL = "http://localhost:5000/api/students";
const ATTENDANCE_URL = "http://localhost:5000/api/attendance";

let currentPage = 1;
const limit = 10;
let editStudentId = null;



// COMMON HELPER FUNCTIONS


// Get today's date in YYYY-MM-DD format
function getTodayDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
}


// Safely read JSON API responses
async function readResponse(response) {
    const data = await response.json().catch(function () {
        return {};
    });

    if (!response.ok) {
        throw new Error(
            data.message || "Request failed: " + response.status
        );
    }

    return data;
}


// Extract student arrays from different API response formats
function extractStudents(result) {
    if (Array.isArray(result)) {
        return result;
    }

    if (result && Array.isArray(result.students)) {
        return result.students;
    }

    return [];
}


// Extract attendance arrays from different API response formats
function extractAttendance(result) {
    if (Array.isArray(result)) {
        return result;
    }

    if (result && Array.isArray(result.attendance)) {
        return result.attendance;
    }

    return [];
}



// STUDENT MANAGEMENT PAGE
// Runs only when student page elements exist


const studentForm = document.getElementById("studentForm");

if (studentForm) {

    
    // ADD OR UPDATE STUDENT
    

    studentForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const student = {
            name: document.getElementById("name").value.trim(),

            rollNumber: Number(
                document.getElementById("rollNumber").value
            ),

            class: document.getElementById("class").value.trim(),

            section: document.getElementById("section").value.trim(),

            age: Number(document.getElementById("age").value)
        };

        // Basic form validation
        if (
            !student.name ||
            !student.class ||
            !student.section ||
            !student.rollNumber ||
            !student.age
        ) {
            alert("Please fill in all student details.");
            return;
        }

        const submitButton = document.getElementById("submitButton");

        try {
            let url = API_URL;
            let method = "POST";

            if (editStudentId !== null) {
                url = API_URL + "/" + editStudentId;
                method = "PUT";
            }

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent =
                    method === "POST" ? "Adding Student..." : "Updating Student...";
            }

            const response = await fetch(url, {
                method: method,

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(student)
            });

            const data = await readResponse(response);

            alert(
                data.message ||
                (
                    method === "POST"
                        ? "Student added successfully!"
                        : "Student updated successfully!"
                )
            );

            editStudentId = null;

            studentForm.reset();

            if (submitButton) {
                submitButton.textContent = "＋ Add Student";
            }

            currentPage = 1;

            await getStudents();

        } catch (error) {
            console.error("Student Save Error:", error);

            alert(
                "Unable to save student.\n\n" +
                error.message +
                "\n\nPlease check your backend server and API routes."
            );

        } finally {
            if (submitButton) {
                submitButton.disabled = false;

                if (editStudentId === null) {
                    submitButton.textContent = "＋ Add Student";
                }
            }
        }
    });


    
    // LOAD STUDENTS AND DASHBOARD
    

    async function getStudents() {
        try {
            const url =
                API_URL +
                "?page=" + currentPage +
                "&limit=" + limit;

            const response = await fetch(url);

            const result = await readResponse(response);

            const students = extractStudents(result);

            // Update student count
            const totalStudentsElement =
                document.getElementById("totalStudents");

            if (totalStudentsElement) {
                let totalCount = students.length;

                try {
                    const countResponse = await fetch(API_URL + "/count");
                    const countData = await readResponse(countResponse);

                    if (typeof countData.totalStudents === "number") {
                        totalCount = countData.totalStudents;
                    } else if (typeof countData.count === "number") {
                        totalCount = countData.count;
                    }
                } catch (countError) {
                    console.warn(
                        "Student count endpoint unavailable:",
                        countError.message
                    );
                }

                totalStudentsElement.textContent = totalCount;
            }

            // Calculate average age for the loaded records
            const averageAgeElement =
                document.getElementById("averageAge");

            if (averageAgeElement) {
                const totalAge = students.reduce(function (sum, student) {
                    return sum + Number(student.age || 0);
                }, 0);

                const averageAge = students.length > 0
                    ? (totalAge / students.length).toFixed(1)
                    : "0";

                averageAgeElement.textContent = averageAge;
            }

            renderStudentTable(students);

            const pageNumber = document.getElementById("pageNumber");

            if (pageNumber) {
                pageNumber.textContent = "Page " + currentPage;
            }

        } catch (error) {
            console.error("Load Students Error:", error);

            const table = document.getElementById("studentTable");

            if (table) {
                table.innerHTML =
                    '<tr><td colspan="6">Unable to load students. Check your backend server.</td></tr>';
            }

            alert(
                "Unable to load students.\n\n" +
                error.message
            );
        }
    }


    
    // DISPLAY STUDENT TABLE
    

    function renderStudentTable(students) {
        const table = document.getElementById("studentTable");

        if (!table) {
            return;
        }

        table.innerHTML = "";

        if (!students.length) {
            table.innerHTML =
                '<tr><td colspan="6" class="loading-cell">No students found.</td></tr>';

            return;
        }

        students.forEach(function (student) {
            const row = document.createElement("tr");

            const values = [
                student.name,
                student.rollNumber,
                student.class,
                student.section,
                student.age
            ];

            values.forEach(function (value) {
                const cell = document.createElement("td");

                cell.textContent =
                    value === undefined || value === null ? "" : value;

                row.appendChild(cell);
            });

            // Action buttons
            const actionCell = document.createElement("td");

            const editButton = document.createElement("button");

            editButton.type = "button";
            editButton.textContent = "Edit";

            editButton.onclick = function () {
                editStudent(student._id);
            };

            const deleteButton = document.createElement("button");

            deleteButton.type = "button";
            deleteButton.textContent = "Delete";

            deleteButton.onclick = function () {
                deleteStudent(student._id);
            };

            actionCell.appendChild(editButton);
            actionCell.appendChild(deleteButton);

            row.appendChild(actionCell);

            table.appendChild(row);
        });
    }


    
    // EDIT STUDENT
    

    async function editStudent(id) {
        try {
            const response = await fetch(API_URL + "/" + id);

            const result = await readResponse(response);

            const student = result.student || result;

            document.getElementById("name").value =
                student.name || "";

            document.getElementById("rollNumber").value =
                student.rollNumber || "";

            document.getElementById("class").value =
                student.class || "";

            document.getElementById("section").value =
                student.section || "";

            document.getElementById("age").value =
                student.age || "";

            editStudentId = id;

            const submitButton =
                document.getElementById("submitButton");

            if (submitButton) {
                submitButton.textContent = "Update Student";
            }

            studentForm.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        } catch (error) {
            console.error("Edit Student Error:", error);

            alert(
                "Unable to load student details.\n\n" +
                error.message
            );
        }
    }


    
    // DELETE STUDENT
    

    async function deleteStudent(id) {
        const confirmed = confirm(
            "Are you sure you want to delete this student?"
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(API_URL + "/" + id, {
                method: "DELETE"
            });

            const data = await readResponse(response);

            alert(data.message || "Student deleted successfully.");

            await getStudents();

        } catch (error) {
            console.error("Delete Student Error:", error);

            alert(
                "Unable to delete student.\n\n" +
                error.message
            );
        }
    }


    
    // SEARCH STUDENTS
    

    async function searchStudents() {
        const searchInput = document.getElementById("searchInput");

        if (!searchInput) {
            return;
        }

        const name = searchInput.value.trim();

        if (!name) {
            currentPage = 1;
            await getStudents();
            return;
        }

        try {
            const url =
                API_URL + "/search/" + encodeURIComponent(name);

            const response = await fetch(url);

            const result = await readResponse(response);

            const students = extractStudents(result);

            renderStudentTable(students);

            const pageNumber = document.getElementById("pageNumber");

            if (pageNumber) {
                pageNumber.textContent = "Search Results";
            }

        } catch (error) {
            console.error("Search Error:", error);

            alert(
                "Unable to search students.\n\n" +
                error.message
            );
        }
    }


    
    // PAGINATION
    

    function nextPage() {
        currentPage++;
        getStudents();
    }


    function previousPage() {
        if (currentPage > 1) {
            currentPage--;
            getStudents();
        }
    }


    // Make functions available to HTML buttons
    window.getStudents = getStudents;
    window.searchStudents = searchStudents;
    window.editStudent = editStudent;
    window.deleteStudent = deleteStudent;
    window.nextPage = nextPage;
    window.previousPage = previousPage;

}



// ATTENDANCE MANAGEMENT PAGE
// Runs only when attendance page elements exist


// Set today's date only if this page has a date input
const attendanceDateInput =
    document.getElementById("attendanceDate");

if (attendanceDateInput) {
    attendanceDateInput.value = getTodayDate();
}



// LOAD STUDENTS INTO ATTENDANCE DROPDOWN


async function loadStudentOptions() {
    const dropdown =
        document.getElementById("attendanceStudent");

    if (!dropdown) {
        return;
    }

    try {
        // Request all students rather than just the first page
        const response = await fetch(API_URL + "?page=1&limit=1000");

        const result = await readResponse(response);

        const students = extractStudents(result);

        const previousValue = dropdown.value;

        dropdown.innerHTML =
            '<option value="">-- Select Student --</option>';

        students.forEach(function (student) {
            const option = document.createElement("option");

            option.value = student._id;

            option.textContent =
                student.name + " (Roll: " + student.rollNumber + ")";

            dropdown.appendChild(option);
        });

        const studentExists = students.some(function (student) {
            return student._id === previousValue;
        });

        if (studentExists) {
            dropdown.value = previousValue;
        }

    } catch (error) {
        console.error("Student Dropdown Error:", error);

        showAttendanceMessage(
            "Unable to load students: " + error.message,
            true
        );
    }
}



// ATTENDANCE FORM SUBMISSION


const attendanceForm =
    document.getElementById("attendanceForm");

if (attendanceForm) {
    attendanceForm.addEventListener("submit", async function (event) {
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
                    studentId: studentId,
                    date: date,
                    status: status
                })
            });

            const data = await readResponse(response);

            showAttendanceMessage(
                data.message || "Attendance marked successfully."
            );

            await loadAttendance();

        } catch (error) {
            console.error("Mark Attendance Error:", error);

            showAttendanceMessage(
                error.message || "Unable to mark attendance.",
                true
            );
        }
    });
}



// LOAD ALL ATTENDANCE RECORDS


async function loadAttendance() {
    const table = document.getElementById("attendanceTable");

    // Do nothing on the student page
    if (!table) {
        return;
    }

    try {
        const response = await fetch(ATTENDANCE_URL);

        const result = await readResponse(response);

        const records = extractAttendance(result);

        renderAttendanceTable(records);

        updateAttendanceDashboard(records);

    } catch (error) {
        console.error("Load Attendance Error:", error);

        table.innerHTML =
            '<tr><td colspan="6">Unable to load attendance records.</td></tr>';

        showAttendanceMessage(
            error.message || "Unable to load attendance.",
            true
        );
    }
}



// ATTENDANCE DASHBOARD

function updateAttendanceDashboard(records) {
    const totalElement =
        document.getElementById("totalAttendance");

    const presentElement =
        document.getElementById("totalPresent");

    const absentElement =
        document.getElementById("totalAbsent");

    if (totalElement) {
        totalElement.textContent = records.length;
    }

    const presentCount = records.filter(function (record) {
        return record.status === "Present";
    }).length;

    const absentCount = records.filter(function (record) {
        return record.status === "Absent";
    }).length;

    if (presentElement) {
        presentElement.textContent = presentCount;
    }

    if (absentElement) {
        absentElement.textContent = absentCount;
    }
}


// DISPLAY ATTENDANCE TABLE


function renderAttendanceTable(records) {
    const table = document.getElementById("attendanceTable");

    if (!table) {
        return;
    }

    table.innerHTML = "";

    if (!records.length) {
        table.innerHTML =
            '<tr><td colspan="6">No attendance records found.</td></tr>';

        return;
    }

    records.forEach(function (record) {
        const row = document.createElement("tr");

        const student =
            record.studentId &&
            typeof record.studentId === "object"
                ? record.studentId
                : {};

        const name = student.name || "Student details unavailable";

        const rollNumber = student.rollNumber || "-";

        const studentClass = student.class || "-";

        const date = record.date
            ? new Date(record.date).toLocaleDateString()
            : "-";

        const values = [
            name,
            rollNumber,
            studentClass,
            date
        ];

        values.forEach(function (value) {
            const cell = document.createElement("td");

            cell.textContent = value;

            row.appendChild(cell);
        });

        const statusCell = document.createElement("td");

        statusCell.textContent = record.status || "-";

        statusCell.className =
            record.status === "Present"
                ? "status-present"
                : "status-absent";

        row.appendChild(statusCell);

        const actionCell = document.createElement("td");

        const toggleButton = document.createElement("button");

        toggleButton.type = "button";
        toggleButton.textContent = "Toggle Status";

        toggleButton.onclick = function () {
            const newStatus =
                record.status === "Present"
                    ? "Absent"
                    : "Present";

            updateAttendance(record._id, newStatus);
        };

        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.textContent = "Delete";

        deleteButton.onclick = function () {
            deleteAttendance(record._id);
        };

        actionCell.appendChild(toggleButton);
        actionCell.appendChild(deleteButton);

        row.appendChild(actionCell);

        table.appendChild(row);
    });
}



// UPDATE ATTENDANCE STATUS


async function updateAttendance(id, status) {
    if (!confirm("Change attendance status to " + status + "?")) {
        return;
    }

    try {
        const response = await fetch(
            ATTENDANCE_URL + "/" + id,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    status: status
                })
            }
        );

        const data = await readResponse(response);

        showAttendanceMessage(
            data.message || "Attendance updated successfully."
        );

        await loadAttendance();

    } catch (error) {
        console.error("Update Attendance Error:", error);

        showAttendanceMessage(
            error.message || "Unable to update attendance.",
            true
        );
    }
}



// DELETE ATTENDANCE


async function deleteAttendance(id) {
    if (!confirm("Are you sure you want to delete this attendance record?")) {
        return;
    }

    try {
        const response = await fetch(
            ATTENDANCE_URL + "/" + id,
            {
                method: "DELETE"
            }
        );

        const data = await readResponse(response);

        showAttendanceMessage(
            data.message || "Attendance deleted successfully."
        );

        await loadAttendance();

    } catch (error) {
        console.error("Delete Attendance Error:", error);

        showAttendanceMessage(
            error.message || "Unable to delete attendance.",
            true
        );
    }
}



// LOAD SELECTED STUDENT ATTENDANCE HISTORY


async function loadSelectedStudentAttendance() {
    const dropdown =
        document.getElementById("attendanceStudent");

    if (!dropdown) {
        return;
    }

    const studentId = dropdown.value;

    if (!studentId) {
        showAttendanceMessage(
            "Please select a student first.",
            true
        );

        return;
    }

    try {
        const url =
            ATTENDANCE_URL + "/student/" + studentId;

        const response = await fetch(url);

        const result = await readResponse(response);

        const records = extractAttendance(result);

        renderAttendanceTable(records);

        updateAttendanceDashboard(records);

        const studentName =
            result.student && result.student.name
                ? result.student.name
                : "selected student";

        showAttendanceMessage(
            "Showing attendance history for " + studentName + "."
        );

    } catch (error) {
        console.error("Student Attendance Error:", error);

        showAttendanceMessage(
            error.message || "Unable to load student attendance history.",
            true
        );
    }
}



// ATTENDANCE MESSAGE


function showAttendanceMessage(message, isError) {
    const element =
        document.getElementById("attendanceMessage");

    if (!element) {
        if (isError) {
            console.error(message);
        }

        return;
    }

    element.textContent = message;

    element.style.color = isError
        ? "#d62828"
        : "#16803c";
}



// START APPLICATION
// Initialize only the current page


async function initializeApp() {
    // Student Management page
    if (document.getElementById("studentForm")) {
        // These functions are defined inside the student page block.
        if (typeof window.getStudents === "function") {
            await window.getStudents();
        }
    }

    // Attendance Management page
    if (document.getElementById("attendanceForm")) {
        await loadStudentOptions();
        await loadAttendance();
    }
}


// Make attendance functions accessible to HTML buttons
window.loadStudentOptions = loadStudentOptions;
window.loadAttendance = loadAttendance;
window.updateAttendance = updateAttendance;
window.deleteAttendance = deleteAttendance;
window.loadSelectedStudentAttendance = loadSelectedStudentAttendance;
window.showAttendanceMessage = showAttendanceMessage;


// Start the page
initializeApp();

