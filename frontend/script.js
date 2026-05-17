const API_URL = "http://localhost:5000/api/students";

let editStudentId = null;

// For Add Student
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
                    `http://localhost:5000/api/students/${editStudentId}`,
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



            alert("Student Added Successfully");

            document.getElementById("studentForm").reset();

            getStudents();

        } catch (error) {

            console.error(error);

        }

    });

async function getStudents() {

    try {

        const response = await fetch(API_URL + "?page=1&limit=100");

        const students = await response.json();

        const table = document.getElementById("studentTable");

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

          
          <button onclick="deleteStudent('${student._id}')">Delete</button>
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
            `http://localhost:5000/api/students/${id}`,
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
function editStudent(id, name, rollNumber, studentClass, section, age) {

    editStudentId = id;

    document.getElementById("name").value = name;
    document.getElementById("rollNumber").value = rollNumber;
    document.getElementById("class").value = studentClass;
    document.getElementById("section").value = section;
    document.getElementById("age").value = age;

}

// Search Students
async function searchStudents() {

    try {

        const name = document.getElementById("searchInput").value;

        const response = await fetch(
            `http://localhost:5000/api/students/search/${name}`
        );

        const students = await response.json();

        const table = document.getElementById("studentTable");

        table.innerHTML = "";

        // If no student found
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



