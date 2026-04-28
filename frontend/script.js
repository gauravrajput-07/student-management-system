const API_URL = "http://localhost:5000/api/students";

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

            await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(student)
            });

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
        </tr>
      `;

            table.innerHTML += row;

        });

    } catch (error) {

        console.error(error);

    }

}