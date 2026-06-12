const API_URL = "http://localhost:5000/api/students";

let editStudentId = null;

// Add / Update Student
document
    .getElementById("studentForm")
    .addEventListener("submit", async function (e) {

        e.preventDefault();

        const student = {
            name: document.getElementById("name").value,
            rollNumber: document.getElementById("rollNumber").value,
            class: document.getElementById("class").value,
            section: document.getElementById("section").value,
            age: document.getElementById("age").value
        };

        try {

            if (editStudentId) {

                await fetch(
                    `${API_URL}/${editStudentId}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(student)
                    }
                );

                alert("Student Updated Successfully");

                editStudentId = null;

            } else {

                await fetch(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(student)
                });

                alert("Student Added Successfully");
            }

            document.getElementById("studentForm").reset();

            getStudents();

        } catch (error) {

            console.error(error);

        }

    });

// Load Students + Dashboard
async function getStudents() {

    try {

        const response = await fetch(
            API_URL + "?page=1&limit=100"
        );

        const students = await response.json();

        // Dashboard Statistics
        document.getElementById("totalStudents").innerText =
            students.length;

        const totalAge = students.reduce(
            (sum, student) => sum + Number(student.age),
            0
        );

        document.getElementById("averageAge").innerText =
            students.length > 0
                ? (totalAge / students.length).toFixed(1)
                : 0;

        // Student Table
        const table =
            document.getElementById("studentTable");

        table.innerHTML = "";

        students.forEach(student => {

            const row = `
                <tr>
                    <td>${student.name}</td>
                    <td>${student.rollNumber}</td>
                    <td>${student.class}</td>
                    <td>${student.section}</td>
                    <td>${student.age}</td>

                    <td>
                        <button onclick="editStudent(
                            '${student._id}',
                            '${student.name}',
                            '${student.rollNumber}',
                            '${student.class}',
                            '${student.section}',
                            '${student.age}'
                        )">
                            Edit
                        </button>

                        <button onclick="deleteStudent('${student._id}')">
                            Delete
                        </button>
                    </td>
                </tr>
            `;

            table.innerHTML += row;

        });

    } catch (error) {

        console.error(error);

    }

}

// Delete Student
async function deleteStudent(id) {

    try {

        const response = await fetch(
            `${API_URL}/${id}`,
            {
                method: "DELETE"
            }
        );

        const data = await response.json();

        alert(data.message);

        getStudents();

    } catch (error) {

        console.error("Delete Error:", error);

    }

}

// Edit Student
function editStudent(
    id,
    name,
    rollNumber,
    studentClass,
    section,
    age
) {

    editStudentId = id;

    document.getElementById("name").value = name;
    document.getElementById("rollNumber").value = rollNumber;
    document.getElementById("class").value = studentClass;
    document.getElementById("section").value = section;
    document.getElementById("age").value = age;

}

// Search Student
async function searchStudents() {

    try {

        const name =
            document.getElementById("searchInput").value;

        const response = await fetch(
            `${API_URL}/search/${name}`
        );

        const students = await response.json();

        const table =
            document.getElementById("studentTable");

        table.innerHTML = "";

        if (students.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="6">
                        Student not found in database
                    </td>
                </tr>
            `;

            return;
        }

        students.forEach(student => {

            const row = `
                <tr>
                    <td>${student.name}</td>
                    <td>${student.rollNumber}</td>
                    <td>${student.class}</td>
                    <td>${student.section}</td>
                    <td>${student.age}</td>

                    <td>
                        <button onclick="editStudent(
                            '${student._id}',
                            '${student.name}',
                            '${student.rollNumber}',
                            '${student.class}',
                            '${student.section}',
                            '${student.age}'
                        )">
                            Edit
                        </button>

                        <button onclick="deleteStudent('${student._id}')">
                            Delete
                        </button>
                    </td>
                </tr>
            `;

            table.innerHTML += row;

        });

    } catch (error) {

        console.error(error);

    }

}

// Auto Load Students
getStudents();