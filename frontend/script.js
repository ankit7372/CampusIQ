

const API_URL = "http://127.0.0.1:8000";

const studentForm = document.getElementById("student-form");
const studentTableBody = document.getElementById("student-table-body");
const studentSearch = document.getElementById("student-search");
const totalStudents = document.getElementById("total-students");
const backendStatus = document.getElementById("backend-status");
const databaseStatus = document.getElementById("database-status");
const formMessage = document.getElementById("form-message");
const addButton = document.getElementById("add-button");

// 1. Check backend status
async function checkBackend() {
    try {
        const response = await fetch(`${API_URL}/health`);

        if (!response.ok) {
            throw new Error("Backend unavailable");
        }

        backendStatus.textContent = "Online";
        backendStatus.style.color = "#15803d";
    } catch (error) {
        backendStatus.textContent = "Offline";
        backendStatus.style.color = "#dc2626";
    }
}

// 2. Check database status
async function checkDatabase() {
    try {
        const response = await fetch(`${API_URL}/db-check`);

        if (!response.ok) {
            throw new Error("Database unavailable");
        }

        const data = await response.json();

        databaseStatus.textContent =
            data.status === "connected" ? "Connected" : "Offline";

        databaseStatus.style.color =
            data.status === "connected" ? "#15803d" : "#dc2626";
    } catch (error) {
        databaseStatus.textContent = "Offline";
        databaseStatus.style.color = "#dc2626";
    }
}

// 3. Load students and display Edit/Delete buttons

async function loadStudents() {
    studentTableBody.innerHTML = `
        <tr><td colspan="6">Loading students...</td></tr>
    `;

    try {
        const response = await fetch(`${API_URL}/students`);

        if (!response.ok) {
            throw new Error("Could not load students");
        }

        const students = await response.json();

        // Total registered students
        totalStudents.textContent = students.length;

        // Get search text
        const searchText = studentSearch.value.trim().toLowerCase();

        // Filter by name, email, or course
        
const filteredStudents = students.filter((student) => {
    return (
        String(student.id).toLowerCase().includes(searchText) ||
        String(student.name).toLowerCase().includes(searchText) ||
        String(student.email).toLowerCase().includes(searchText) ||
        String(student.course).toLowerCase().includes(searchText) ||
        String(student.semester).toLowerCase().includes(searchText)
    );
});


        studentTableBody.replaceChildren();

        if (filteredStudents.length === 0) {
            studentTableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        ${
                            searchText
                                ? "No matching students found."
                                : "No students registered yet."
                        }
                    </td>
                </tr>
            `;
            return;
        }

        filteredStudents.forEach((student) => {
            const row = document.createElement("tr");

            const values = [
                student.id,
                student.name,
                student.email,
                student.course,
                student.semester
            ];

            values.forEach((value) => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            const actionCell = document.createElement("td");

            // Edit button
            const editButton = document.createElement("button");
            editButton.textContent = "Edit";
            editButton.className = "secondary-button";
            editButton.type = "button";

            editButton.addEventListener("click", () => {
                editStudent(student);
            });

            // Delete button
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.className = "delete-button";
            deleteButton.type = "button";

            deleteButton.addEventListener("click", () => {
                deleteStudent(student.id);
            });

            actionCell.appendChild(editButton);
            actionCell.appendChild(document.createTextNode(" "));
            actionCell.appendChild(deleteButton);

            row.appendChild(actionCell);
            studentTableBody.appendChild(row);
        });

    } catch (error) {
        totalStudents.textContent = "—";

        studentTableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    Unable to load students. Check the backend server.
                </td>
            </tr>
        `;
    }
}


// 4. Add a new student
studentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const course = document.getElementById("course").value.trim();
    const semester = Number(
        document.getElementById("semester").value
    );

    if (
        !name ||
        !email ||
        !email.includes("@") ||
        !course ||
        !Number.isInteger(semester) ||
        semester < 1 ||
        semester > 12
    ) {
        formMessage.textContent = "Please enter valid student details.";
        formMessage.style.color = "#dc2626";
        return;
    }

    addButton.disabled = true;
    addButton.textContent = "Adding...";
    formMessage.textContent = "";

    try {
        const params = new URLSearchParams({
            name,
            email,
            course,
            semester: String(semester)
        });

        const response = await fetch(
            `${API_URL}/students?${params.toString()}`,
            { method: "POST" }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Unable to add student.");
        }

        formMessage.textContent = "Student added successfully!";
        formMessage.style.color = "#15803d";

        studentForm.reset();

        await loadStudents();
        await checkDatabase();
    } catch (error) {
        formMessage.textContent = error.message;
        formMessage.style.color = "#dc2626";
    } finally {
        addButton.disabled = false;
        addButton.textContent = "+ Add Student";
    }
});

// 5. Edit an existing student
async function editStudent(student) {
    const name = window.prompt("Enter student name:", student.name);

    if (name === null) return;

    const email = window.prompt("Enter student email:", student.email);

    if (email === null) return;

    const course = window.prompt("Enter student course:", student.course);

    if (course === null) return;

    const semesterInput = window.prompt(
        "Enter semester (1-12):",
        String(student.semester)
    );

    if (semesterInput === null) return;

    const semester = Number(semesterInput);

    if (
        !name.trim() ||
        !email.trim() ||
        !email.includes("@") ||
        !course.trim() ||
        !Number.isInteger(semester) ||
        semester < 1 ||
        semester > 12
    ) {
        window.alert("Please enter valid student details.");
        return;
    }

    try {
        const params = new URLSearchParams({
            name: name.trim(),
            email: email.trim(),
            course: course.trim(),
            semester: String(semester)
        });

        const response = await fetch(
            `${API_URL}/students/${student.id}?${params.toString()}`,
            { method: "PUT" }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Unable to update student.");
        }

        formMessage.textContent = "Student updated successfully!";
        formMessage.style.color = "#15803d";

        await loadStudents();
        await checkDatabase();
    } catch (error) {
        formMessage.textContent = error.message;
        formMessage.style.color = "#dc2626";
    }
}

// 6. Delete a student
async function deleteStudent(studentId) {
    const confirmed = window.confirm(
        `Are you sure you want to delete student ID ${studentId}?`
    );

    if (!confirmed) return;

    try {
        const response = await fetch(
            `${API_URL}/students/${studentId}`,
            { method: "DELETE" }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Unable to delete student.");
        }

        formMessage.textContent = "Student deleted successfully!";
        formMessage.style.color = "#15803d";

        await loadStudents();
        await checkDatabase();
    } catch (error) {
        formMessage.textContent = error.message;
        formMessage.style.color = "#dc2626";
    }
}

// 7. Refresh dashboard
document.getElementById("refresh-button").addEventListener(
    "click",
    async () => {
        await loadStudents();
        await checkBackend();
        await checkDatabase();
    }
);

// 8. Initialize dashboard
async function initializeDashboard() {
    await Promise.all([
        loadStudents(),
        checkBackend(),
        checkDatabase()
    ]);
}

studentSearch.addEventListener("input", () => {
    loadStudents();
});

initializeDashboard();

