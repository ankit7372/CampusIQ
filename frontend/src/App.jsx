
import { useCallback, useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

const ui = {
  app: {
    minHeight: "100vh",
    display: "flex",
    background: "#f4f7fb",
    color: "#172033",
    fontFamily: "Arial, sans-serif",
  },
  sidebar: {
    width: 230,
    minWidth: 210,
    background: "#172554",
    color: "#fff",
    padding: 24,
  },
  brand: { fontSize: 23, fontWeight: 700, margin: "0 0 8px" },
  subtitle: { fontSize: 12, color: "#c7d2fe", marginBottom: 30 },
  nav: { display: "flex", flexDirection: "column", gap: 8 },
  navButton: {
    width: "100%",
    padding: 12,
    textAlign: "left",
    border: 0,
    borderRadius: 8,
    color: "#e0e7ff",
    background: "transparent",
    cursor: "pointer",
    fontSize: 14,
  },
  activeNav: { background: "#3730a3", color: "#fff" },
  main: { flex: 1, minWidth: 0, padding: 28 },
  heading: { margin: "0 0 8px", fontSize: 28 },
  muted: { color: "#64748b", fontSize: 14 },
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    minWidth: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 16,
  },
  label: {
    display: "block",
    marginBottom: 7,
    fontSize: 13,
    fontWeight: 600,
    color: "#334155",
  },
  input: {
    display: "block",
    width: "100%",
    minWidth: 0,
    height: 46,
    padding: "11px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    boxSizing: "border-box",
    fontSize: 14,
    lineHeight: 1.5,
    color: "#111827",
    backgroundColor: "#fff",
    fontFamily: "Arial, sans-serif",
  },
  button: {
    padding: "11px 16px",
    background: "#4338ca",
    color: "#fff",
    border: 0,
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
  secondaryButton: {
    padding: "9px 12px",
    background: "#e2e8f0",
    color: "#1e293b",
    border: 0,
    borderRadius: 7,
    cursor: "pointer",
  },
  deleteButton: {
    padding: "9px 12px",
    background: "#fee2e2",
    color: "#b91c1c",
    border: 0,
    borderRadius: 7,
    cursor: "pointer",
  },
  tableWrap: { width: "100%", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: {
    padding: "13px 12px",
    textAlign: "left",
    background: "#f8fafc",
    color: "#475569",
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "13px 12px",
    borderBottom: "1px solid #e2e8f0",
    verticalAlign: "middle",
  },
  message: {
    padding: "12px 14px",
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
    overflowWrap: "anywhere",
  },
};

function getErrorMessage(data, fallback) {
  if (typeof data?.detail === "string") return data.detail;

  if (Array.isArray(data?.detail)) {
    return data.detail.map((item) => item.msg).join(", ");
  }

  return fallback;
}

function FormField({ label, children }) {
  return (
    <div style={{ minWidth: 0 }}>
      <label style={ui.label}>{label}</label>
      {children}
    </div>
  );
}

function App() {
  const [page, setPage] = useState("Dashboard");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [courses, setCourses] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseSaving, setCourseSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentCourse, setStudentCourse] = useState("B.Tech CSE");
  const [studentSemester, setStudentSemester] = useState("7");
  const [editingStudentId, setEditingStudentId] = useState(null);

  const [selectedStudent, setSelectedStudent] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [attendanceStatus, setAttendanceStatus] = useState("Present");
  const [filterDate, setFilterDate] = useState("");
  const [filterStudent, setFilterStudent] = useState("");

  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseDuration, setCourseDuration] = useState("4");
  const [courseDescription, setCourseDescription] = useState("");
  const [editingCourseId, setEditingCourseId] = useState(null);

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
  };

  const request = async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, options);
    const text = await response.text();

    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          data,
          `Request failed with HTTP status ${response.status}.`
        )
      );
    }

    return data;
  };


  const handleChatSubmit = async (event) => {
    event.preventDefault();

    const userMessage = chatInput.trim();
    if (!userMessage || chatLoading) return;

    setChatMessages((previous) => [
      ...previous,
      { role: "user", text: userMessage },
    ]);
    setChatInput("");
    setChatLoading(true);

    try {
      const data = await request("/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const reply =
        data?.reply ??
        data?.response ??
        data?.answer ??
        data?.message;

      if (typeof reply !== "string" || !reply.trim()) {
        throw new Error(
          "The AI returned an empty response. Check the backend response format."
        );
      }

      setChatMessages((previous) => [
        ...previous,
        { role: "assistant", text: reply },
      ]);
    } catch (error) {
      setChatMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: `Sorry, I couldn't get a response. ${error.message}`,
          isError: true,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };


  // ---------------- STUDENT FUNCTIONS ----------------

  const loadStudents = useCallback(async () => {
    try {
      const data = await request("/students");
      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      showMessage(`Failed to load student records: ${error.message}`, "error");
    }
  }, []);

  // ---------------- ATTENDANCE FUNCTIONS ----------------

  const loadAttendance = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (filterDate) params.set("attendance_date", filterDate);
      if (filterStudent) params.set("student_id", filterStudent);

      const query = params.toString();
      const data = await request(`/attendance${query ? `?${query}` : ""}`);

      setAttendance(Array.isArray(data) ? data : []);
    } catch (error) {
      showMessage(`Failed to load attendance records: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterStudent]);

  // ---------------- COURSE FUNCTIONS ----------------

  const loadCourses = useCallback(async () => {
    setCourseLoading(true);

    try {
      const data = await request("/courses");
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      showMessage(`Failed to load courses: ${error.message}`, "error");
    } finally {
      setCourseLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    if (page === "Attendance") {
      loadAttendance();
    }
  }, [page, loadAttendance]);

  useEffect(() => {
    if (page === "Courses") {
      loadCourses();
    }
  }, [page, loadCourses]);

  const resetStudentForm = () => {
    setStudentName("");
    setStudentEmail("");
    setStudentCourse("B.Tech CSE");
    setStudentSemester("7");
    setEditingStudentId(null);
  };

  const resetCourseForm = () => {
    setCourseName("");
    setCourseCode("");
    setCourseDuration("4");
    setCourseDescription("");
    setEditingCourseId(null);
  };

  const handleStudentSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const params = new URLSearchParams({
        name: studentName.trim(),
        email: studentEmail.trim(),
        course: studentCourse.trim(),
        semester: studentSemester,
      });

      const path = editingStudentId
        ? `/students/${editingStudentId}?${params.toString()}`
        : `/students?${params.toString()}`;

      await request(path, {
        method: editingStudentId ? "PUT" : "POST",
      });

      showMessage(
        editingStudentId
          ? "Student record updated successfully."
          : "Student record created successfully."
      );

      resetStudentForm();
      await loadStudents();

      if (page === "Courses") await loadCourses();
    } catch (error) {
      showMessage(`Unable to save student record: ${error.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEditStudent = (student) => {
    setStudentName(student.name || "");
    setStudentEmail(student.email || "");
    setStudentCourse(student.course || "");
    setStudentSemester(String(student.semester ?? ""));
    setEditingStudentId(student.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteStudent = async (student) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the record for ${student.name}?`
      )
    ) {
      return;
    }

    try {
      await request(`/students/${student.id}`, { method: "DELETE" });

      showMessage("Student record deleted successfully.");

      if (String(selectedStudent) === String(student.id)) {
        setSelectedStudent("");
      }

      if (String(filterStudent) === String(student.id)) {
        setFilterStudent("");
      }

      await loadStudents();
      await loadAttendance();
      await loadCourses();
    } catch (error) {
      showMessage(`Unable to delete student record: ${error.message}`, "error");
    }
  };

  const handleMarkAttendance = async (event) => {
    event.preventDefault();

    if (!selectedStudent) {
      showMessage("Please select a student before recording attendance.", "error");
      return;
    }

    if (!attendanceDate) {
      showMessage("Please select an attendance date.", "error");
      return;
    }

    setSaving(true);

    try {
      const params = new URLSearchParams({
        student_id: selectedStudent,
        status: attendanceStatus,
        attendance_date: attendanceDate,
      });

      await request(`/attendance?${params.toString()}`, {
        method: "POST",
      });

      showMessage("Attendance recorded successfully.");
      await loadAttendance();
    } catch (error) {
      showMessage(`Unable to record attendance: ${error.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAttendanceStatusChange = async (record, newStatus) => {
    try {
      const params = new URLSearchParams({ status: newStatus });

      await request(`/attendance/${record.id}?${params.toString()}`, {
        method: "PUT",
      });

      showMessage("Attendance status updated successfully.");
      await loadAttendance();
    } catch (error) {
      showMessage(
        `Unable to update attendance status: ${error.message}`,
        "error"
      );
    }
  };

  const handleCourseSubmit = async (event) => {
    event.preventDefault();
    setCourseSaving(true);

    try {
      const params = new URLSearchParams({
        name: courseName.trim(),
        code: courseCode.trim().toUpperCase(),
        duration_years: courseDuration,
        description: courseDescription.trim(),
      });

      const path = editingCourseId
        ? `/courses/${editingCourseId}?${params.toString()}`
        : `/courses?${params.toString()}`;

      await request(path, {
        method: editingCourseId ? "PUT" : "POST",
      });

      showMessage(
        editingCourseId
          ? "Course updated successfully."
          : "Course created successfully."
      );

      resetCourseForm();
      await loadCourses();
    } catch (error) {
      showMessage(`Unable to save course: ${error.message}`, "error");
    } finally {
      setCourseSaving(false);
    }
  };

  const handleEditCourse = (course) => {
    setCourseName(course.name || "");
    setCourseCode(course.code || "");
    setCourseDuration(String(course.duration_years ?? 4));
    setCourseDescription(course.description || "");
    setEditingCourseId(course.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteCourse = async (course) => {
    if (
      !window.confirm(
        `Are you sure you want to delete course ${course.name}?`
      )
    ) {
      return;
    }

    try {
      await request(`/courses/${course.id}`, { method: "DELETE" });
      showMessage("Course deleted successfully.");
      await loadCourses();
    } catch (error) {
      showMessage(`Unable to delete course: ${error.message}`, "error");
    }
  };

  const navItems = [
    "Dashboard",
    "Students",
    "Attendance",
    "Courses",
    "AI Assistant",
  ];

  const presentCount = attendance.filter(
    (record) => record.status === "Present"
  ).length;

  const absentCount = attendance.filter(
    (record) => record.status === "Absent"
  ).length;

  const statCard = (title, value, description) => (
    <div key={title} style={ui.card}>
      <div style={ui.muted}>{title}</div>
      <div style={{ fontSize: 30, fontWeight: 700, margin: "12px 0" }}>
        {value}
      </div>
      <div style={ui.muted}>{description}</div>
    </div>
  );

  const renderStudentOptions = (placeholder = "Select a student") => (
    <>
      <option value="" style={{ color: "#111827", backgroundColor: "#ffffff" }}>
        {placeholder}
      </option>
      {students.map((student) => (
        <option
          key={student.id}
          value={String(student.id)}
          style={{ color: "#111827", backgroundColor: "#ffffff" }}
        >
          {student.name} (ID: {student.id})
        </option>
      ))}
    </>
  );

  return (
    <div className="campusiq-app" style={ui.app}>
      <style>{`
        .campusiq-app, .campusiq-app * {
          box-sizing: border-box;
        }

        .campusiq-app input,
        .campusiq-app select,
        .campusiq-app textarea {
          color: #111827 !important;
          background-color: #ffffff !important;
          font-family: Arial, sans-serif;
          opacity: 1 !important;
        }

        .campusiq-app select {
          display: block !important;
          width: 100% !important;
          min-width: 0 !important;
          height: 46px !important;
          min-height: 46px !important;
          padding: 10px 12px !important;
          border: 1px solid #cbd5e1 !important;
          border-radius: 8px !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
          appearance: auto !important;
          -webkit-appearance: menulist !important;
          cursor: pointer !important;
        }

        .campusiq-app select option {
          color: #111827 !important;
          background: #ffffff !important;
        }

        .campusiq-app input:focus,
        .campusiq-app select:focus {
          outline: 2px solid #818cf8;
          outline-offset: 2px;
        }

        @media (max-width: 700px) {
          .campusiq-app {
            flex-direction: column !important;
          }

          .campusiq-sidebar {
            width: 100% !important;
          }

          .campusiq-main {
            padding: 16px !important;
          }

          .campusiq-nav {
            flex-direction: row !important;
            flex-wrap: wrap;
          }

          .campusiq-nav button {
            width: auto !important;
          }
        }
      `}</style>

      <aside className="campusiq-sidebar" style={ui.sidebar}>
        <h1 style={ui.brand}>CampusIQ AI</h1>
        <div style={ui.subtitle}>Smart Campus Management</div>

        <nav className="campusiq-nav" style={ui.nav}>
          {navItems.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setPage(item);
                setMessage("");
              }}
              style={{
                ...ui.navButton,
                ...(page === item ? ui.activeNav : {}),
              }}
            >
              {item === "AI Assistant" ? "ðŸ¤– " : ""}
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <main className="campusiq-main" style={ui.main}>
        <header style={{ marginBottom: 24 }}>
          <h2 style={ui.heading}>{page}</h2>
          <p style={ui.muted}>
            {page === "Dashboard" && "Campus overview and operational statistics."}
            {page === "Students" && "Manage student records and academic information."}
            {page === "Attendance" && "Record, review, and update student attendance."}
            {page === "Courses" && "Manage courses and review student enrollment."}
            {page === "AI Assistant" && "Campus assistance and AI integration."}
          </p>
        </header>

        {message && (
          <div
            role="status"
            aria-live="polite"
            style={{
              ...ui.message,
              background: messageType === "error" ? "#fee2e2" : "#dcfce7",
              color: messageType === "error" ? "#991b1b" : "#166534",
            }}
          >
            {message}
            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Dismiss notification"
              style={{
                float: "right",
                border: 0,
                background: "transparent",
                cursor: "pointer",
                color: "inherit",
              }}
            >
              Ã—
            </button>
          </div>
        )}

        {page === "Dashboard" && (
          <>
            <div style={ui.grid}>
              {statCard("Total Students", students.length, "Registered student records")}
              {statCard("Attendance Records", attendance.length, "Records in the current view")}
              {statCard("Present", presentCount, "Present attendance records")}
              {statCard("Absent", absentCount, "Absent attendance records")}
            </div>

            <section style={ui.card}>
              <h3 style={{ marginTop: 0 }}>Welcome to CampusIQ AI</h3>
              <p style={ui.muted}>
                Manage student records and attendance through a centralized dashboard.
              </p>
              <button
                type="button"
                style={ui.button}
                onClick={() => setPage("Students")}
              >
                Manage Students
              </button>{" "}
              <button
                type="button"
                style={ui.secondaryButton}
                onClick={() => setPage("Attendance")}
              >
                View Attendance
              </button>
            </section>
          </>
        )}

        {page === "Students" && (
          <>
            <section style={ui.card}>
              <h3 style={{ marginTop: 0 }}>
                {editingStudentId ? "Update Student Record" : "Create Student Record"}
              </h3>

              <form onSubmit={handleStudentSubmit}>
                <div style={ui.grid}>
                  <FormField label="Full Name">
                    <input
                      style={ui.input}
                      value={studentName}
                      onChange={(event) => setStudentName(event.target.value)}
                      placeholder="Enter full name"
                      autoComplete="name"
                      required
                    />
                  </FormField>

                  <FormField label="Email Address">
                    <input
                      style={ui.input}
                      type="email"
                      value={studentEmail}
                      onChange={(event) => setStudentEmail(event.target.value)}
                      placeholder="student@example.com"
                      autoComplete="email"
                      required
                    />
                  </FormField>

                  <FormField label="Course">
                    <input
                      style={ui.input}
                      value={studentCourse}
                      onChange={(event) => setStudentCourse(event.target.value)}
                      placeholder="e.g. B.Tech CSE"
                      required
                    />
                  </FormField>

                  <FormField label="Semester">
                    <select
                      style={ui.input}
                      value={studentSemester}
                      onChange={(event) => setStudentSemester(event.target.value)}
                      required
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                        <option key={semester} value={String(semester)}>
                          Semester {semester}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                  <button type="submit" disabled={saving} style={ui.button}>
                    {saving
                      ? "Saving..."
                      : editingStudentId
                        ? "Update Student"
                        : "Create Student"}
                  </button>

                  {editingStudentId && (
                    <button
                      type="button"
                      style={ui.secondaryButton}
                      onClick={resetStudentForm}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>

            <section style={ui.card}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 16,
                }}
              >
                <h3 style={{ margin: 0 }}>Student Records ({students.length})</h3>
                <button
                  type="button"
                  style={ui.secondaryButton}
                  onClick={loadStudents}
                >
                  Refresh Records
                </button>
              </div>

              <div style={ui.tableWrap}>
                <table style={ui.table}>
                  <thead>
                    <tr>
                      {["ID", "Name", "Email", "Course", "Semester", "Actions"].map(
                        (heading) => (
                          <th key={heading} style={ui.th}>{heading}</th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td style={ui.td}>{student.id}</td>
                        <td style={ui.td}>{student.name}</td>
                        <td style={ui.td}>{student.email}</td>
                        <td style={ui.td}>{student.course}</td>
                        <td style={ui.td}>{student.semester}</td>
                        <td style={ui.td}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              type="button"
                              style={ui.secondaryButton}
                              onClick={() => handleEditStudent(student)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              style={ui.deleteButton}
                              onClick={() => handleDeleteStudent(student)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {students.length === 0 && (
                      <tr>
                        <td colSpan={6} style={ui.td}>
                          No student records available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {page === "Attendance" && (
          <>
            <section style={ui.card}>
              <h3 style={{ marginTop: 0 }}>Record Student Attendance</h3>

              <form onSubmit={handleMarkAttendance}>
                <div style={ui.grid}>
                  <FormField label="Select Student">
                    <select
                      value={selectedStudent}
                      onChange={(event) => setSelectedStudent(event.target.value)}
                      style={ui.input}
                      required
                    >
                      {renderStudentOptions()}
                    </select>
                  </FormField>

                  <FormField label="Attendance Date">
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(event) => setAttendanceDate(event.target.value)}
                      style={ui.input}
                      required
                    />
                  </FormField>

                  <FormField label="Attendance Status">
                    <select
                      value={attendanceStatus}
                      onChange={(event) => setAttendanceStatus(event.target.value)}
                      style={ui.input}
                      required
                    >
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                    </select>
                  </FormField>
                </div>

                <button
                  type="submit"
                  disabled={saving || students.length === 0}
                  style={{
                    ...ui.button,
                    marginTop: 18,
                    opacity: saving || students.length === 0 ? 0.6 : 1,
                  }}
                >
                  {saving ? "Recording..." : "Record Attendance"}
                </button>

                {students.length === 0 && (
                  <p style={ui.muted}>
                    Create at least one student record before recording attendance.
                  </p>
                )}
              </form>
            </section>

            <section style={ui.card}>
              <h3 style={{ marginTop: 0 }}>Filter Attendance Records</h3>

              <div style={ui.grid}>
                <FormField label="Filter by Date">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(event) => setFilterDate(event.target.value)}
                    style={ui.input}
                  />
                </FormField>

                <FormField label="Filter by Student">
                  <select
                    value={filterStudent}
                    onChange={(event) => setFilterStudent(event.target.value)}
                    style={ui.input}
                  >
                    {renderStudentOptions("All Students")}
                  </select>
                </FormField>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  style={ui.button}
                  onClick={loadAttendance}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Apply Filters"}
                </button>

                <button
                  type="button"
                  style={ui.secondaryButton}
                  onClick={() => {
                    setFilterDate("");
                    setFilterStudent("");
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </section>

            <section style={ui.card}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <h3 style={{ margin: 0 }}>Attendance Records</h3>
                <button
                  type="button"
                  style={ui.secondaryButton}
                  onClick={loadAttendance}
                >
                  Refresh Records
                </button>
              </div>

              <div style={ui.tableWrap}>
                <table style={ui.table}>
                  <thead>
                    <tr>
                      {[
                        "Record ID",
                        "Student",
                        "Student ID",
                        "Date",
                        "Status",
                        "Update Status",
                      ].map((heading) => (
                        <th key={heading} style={ui.th}>{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((record) => (
                      <tr key={record.id}>
                        <td style={ui.td}>{record.id}</td>
                        <td style={ui.td}>
                          {record.student_name ||
                            students.find(
                              (student) =>
                                String(student.id) === String(record.student_id)
                            )?.name ||
                            `Student ${record.student_id}`}
                        </td>
                        <td style={ui.td}>{record.student_id}</td>
                        <td style={ui.td}>{record.date}</td>
                        <td style={ui.td}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "5px 9px",
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 700,
                              background:
                                record.status === "Present" ? "#dcfce7" : "#fee2e2",
                              color:
                                record.status === "Present" ? "#166534" : "#991b1b",
                            }}
                          >
                            {record.status}
                          </span>
                        </td>
                        <td style={ui.td}>
                          <select
                            aria-label={`Update attendance record ${record.id}`}
                            value={record.status}
                            onChange={(event) =>
                              handleAttendanceStatusChange(record, event.target.value)
                            }
                            style={{ ...ui.input, minWidth: 120 }}
                          >
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                          </select>
                        </td>
                      </tr>
                    ))}

                    {attendance.length === 0 && (
                      <tr>
                        <td colSpan={6} style={ui.td}>
                          {loading
                            ? "Loading attendance records..."
                            : "No attendance records match the selected filters."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {page === "Courses" && (
          <>
            <section style={ui.card}>
              <h3 style={{ marginTop: 0 }}>
                {editingCourseId ? "Update Course" : "Add New Course"}
              </h3>

              <form onSubmit={handleCourseSubmit}>
                <div style={ui.grid}>
                  <FormField label="Course Name">
                    <input
                      style={ui.input}
                      value={courseName}
                      onChange={(event) => setCourseName(event.target.value)}
                      placeholder="e.g. B.Tech CSE"
                      required
                    />
                  </FormField>

                  <FormField label="Course Code">
                    <input
                      style={ui.input}
                      value={courseCode}
                      onChange={(event) => setCourseCode(event.target.value)}
                      placeholder="e.g. CSE101"
                      required
                    />
                  </FormField>

                  <FormField label="Duration (Years)">
                    <select
                      style={ui.input}
                      value={courseDuration}
                      onChange={(event) => setCourseDuration(event.target.value)}
                      required
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((year) => (
                        <option key={year} value={String(year)}>
                          {year} {year === 1 ? "Year" : "Years"}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Description">
                    <input
                      style={ui.input}
                      value={courseDescription}
                      onChange={(event) => setCourseDescription(event.target.value)}
                      placeholder="Course description (optional)"
                    />
                  </FormField>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                  <button
                    type="submit"
                    disabled={courseSaving}
                    style={{
                      ...ui.button,
                      opacity: courseSaving ? 0.6 : 1,
                    }}
                  >
                    {courseSaving
                      ? "Saving..."
                      : editingCourseId
                        ? "Update Course"
                        : "Add Course"}
                  </button>

                  {editingCourseId && (
                    <button
                      type="button"
                      style={ui.secondaryButton}
                      onClick={resetCourseForm}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>

            <section style={ui.card}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <h3 style={{ margin: 0 }}>
                  Course Records ({courses.length})
                </h3>

                <button
                  type="button"
                  style={ui.secondaryButton}
                  onClick={loadCourses}
                  disabled={courseLoading}
                >
                  {courseLoading ? "Loading..." : "Refresh Courses"}
                </button>
              </div>

              <div style={ui.tableWrap}>
                <table style={ui.table}>
                  <thead>
                    <tr>
                      {[
                        "ID",
                        "Course Name",
                        "Code",
                        "Duration",
                        "Enrolled Students",
                        "Description",
                        "Actions",
                      ].map((heading) => (
                        <th key={heading} style={ui.th}>{heading}</th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {courses.map((course) => (
                      <tr key={course.id}>
                        <td style={ui.td}>{course.id}</td>
                        <td style={ui.td}>{course.name}</td>
                        <td style={ui.td}>{course.code}</td>
                        <td style={ui.td}>
                          {course.duration_years}{" "}
                          {course.duration_years === 1 ? "Year" : "Years"}
                        </td>
                        <td style={ui.td}>{course.enrolled_students}</td>
                        <td style={ui.td}>{course.description || "â€”"}</td>
                        <td style={ui.td}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              type="button"
                              style={ui.secondaryButton}
                              onClick={() => handleEditCourse(course)}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              style={ui.deleteButton}
                              onClick={() => handleDeleteCourse(course)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {courses.length === 0 && (
                      <tr>
                        <td colSpan={7} style={ui.td}>
                          {courseLoading
                            ? "Loading courses..."
                            : "No courses found. Add a course using the form above."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}


        {page === "AI Assistant" && (
          <section style={{ ...ui.card, padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: 20,
                borderBottom: "1px solid #e2e8f0",
                background: "#f8fafc",
              }}
            >
              <h3 style={{ margin: "0 0 6px" }}>
                ðŸ¤– CampusIQ AI Assistant
              </h3>
              <p style={{ ...ui.muted, margin: 0 }}>
                Ask questions and get assistance from your AI campus assistant.
              </p>
            </div>

            <div
              role="log"
              aria-live="polite"
              style={{
                minHeight: 300,
                maxHeight: 450,
                overflowY: "auto",
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 14,
                background: "#ffffff",
              }}
            >
              {chatMessages.length === 0 && (
                <div style={{ textAlign: "center", margin: "auto", padding: 20 }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>ðŸ’¬</div>
                  <h4 style={{ margin: "0 0 8px" }}>
                    Welcome to CampusIQ AI
                  </h4>
                  <p style={ui.muted}>
                    Ask me a question to get started.
                  </p>
                </div>
              )}

              {chatMessages.map((chat, index) => (
                <div
                  key={index}
                  style={{
                    alignSelf:
                      chat.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                    padding: "12px 15px",
                    borderRadius: 12,
                    background:
                      chat.role === "user" ? "#4338ca" : "#f1f5f9",
                    color:
                      chat.role === "user"
                        ? "#ffffff"
                        : chat.isError
                          ? "#b91c1c"
                          : "#172033",
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    lineHeight: 1.6,
                    fontSize: 14,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      marginBottom: 5,
                      opacity: 0.8,
                    }}
                  >
                    {chat.role === "user" ? "You" : "CampusIQ AI"}
                  </div>
                  {chat.text}
                </div>
              ))}

              {chatLoading && (
                <div
                  style={{
                    alignSelf: "flex-start",
                    padding: "12px 15px",
                    borderRadius: 12,
                    background: "#f1f5f9",
                    color: "#475569",
                    fontSize: 14,
                  }}
                >
                  CampusIQ AI is thinking...
                </div>
              )}
            </div>

            <form
              onSubmit={handleChatSubmit}
              style={{
                display: "flex",
                gap: 10,
                padding: 16,
                borderTop: "1px solid #e2e8f0",
                background: "#f8fafc",
              }}
            >
              <input
                aria-label="Message for CampusIQ AI"
                style={{ ...ui.input, flex: 1 }}
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Type your message..."
                disabled={chatLoading}
                maxLength={4000}
                required
              />

              <button
                type="submit"
                style={{
                  ...ui.button,
                  opacity: chatLoading || !chatInput.trim() ? 0.6 : 1,
                }}
                disabled={chatLoading || !chatInput.trim()}
              >
                {chatLoading ? "Sending..." : "Send"}
              </button>
            </form>

            <div
              style={{
                padding: "0 16px 14px",
                background: "#f8fafc",
                color: "#64748b",
                fontSize: 12,
              }}
            >
              AI responses may take several seconds.
            </div>
          </section>
        )}


        <footer
          style={{
            padding: "12px 0",
            color: "#94a3b8",
            fontSize: 12,
            textAlign: "center",
          }}
        >
          CampusIQ AI Â· Smart Campus Management System
        </footer>
      </main>
    </div>
  );
}

export default App;
