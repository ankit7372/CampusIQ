

import { useEffect, useState } from "react";
import "./App.css";

const menuItems = [
  "Dashboard",
  "Students",
  "Attendance",
  "Courses",
  "AI Assistant",
];

function App() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState("Dashboard");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/students")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Students data not loaded");
        }
        return response.json();
      })
      .then((data) => {
        console.log("API data:", data);
        console.log("Total students:", data.length);

        setStudents(data);
        setLoading(false);
      })
      
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="app">
      <aside className="sidebar">
        <h2 className="brand">
          CampusIQ <span>AI</span>
        </h2>

        <p className="subtitle">Smart Campus Management</p>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item}
              className={`nav-item ${
                activePage === item ? "active" : ""
              }`}
              onClick={() => setActivePage(item)}
            >
              {item === "Dashboard" && "▦"}
              {item === "Students" && "♙"}
              {item === "Attendance" && "✓"}
              {item === "Courses" && "▤"}
              {item === "AI Assistant" && "✦"}
              <span>{item}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="avatar">A</div>
          <div>
            <strong>Admin</strong>
            <p>Campus Administrator</p>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">CAMPUS MANAGEMENT SYSTEM</p>
            <h1>{activePage}</h1>
          </div>

          <div className="status">
            <span /> System Online
          </div>
        </header>

        {activePage === "Dashboard" ? (
          <>
            <section className="welcome">
              <div>
                <p className="eyebrow">YOUR CAMPUS AT A GLANCE</p>
                <h2>Welcome to CampusIQ AI</h2>
                <p>
                  Manage students and campus activities in one place.
                </p>
              </div>

              <div className="welcome-icon">✦</div>
            </section>

            <section className="stats-grid">
              <StatCard
                title="Total Students"
                value={
                  loading
                    ? "Loading..."
                    : error
                    ? "Error"
                    : students.length
                }
                icon="♙"
                note={
                  error
                    ? error
                    : "Live data from database"
                }
              />

              <StatCard
                title="Attendance"
                value="—"
                icon="✓"
                note="Attendance module pending"
              />

              <StatCard
                title="Courses"
                value="—"
                icon="▤"
                note="Course module pending"
              />

              <StatCard
                title="AI Assistant"
                value="Ready soon"
                icon="✦"
                note="Integration planned"
              />
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Campus Overview</h3>
                  <p>Your student management workspace</p>
                </div>

                <button
                  className="primary-button"
                  onClick={() => setActivePage("Students")}
                >
                  Manage Students →
                </button>
              </div>

              <div className="overview-content">
                <div className="overview-symbol">▦</div>
                <div>
                  <h3>Your dashboard is connected</h3>
                  <p>
                    Student data is being loaded from the
                    CampusIQ backend.
                  </p>
                </div>
              </div>
            </section>
          </>
        ) : activePage === "Students" ? (
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Student Management</h3>
                <p>Students retrieved from the backend API</p>
              </div>

              <button
                className="primary-button"
                onClick={() =>
                  window.open(
                    "http://127.0.0.1:8000/docs",
                    "_blank"
                  )
                }
              >
                Open Student API →
              </button>
            </div>

            {loading ? (
              <p>Loading students...</p>
            ) : error ? (
              <p>{error}</p>
            ) : students.length === 0 ? (
              <p>No students found.</p>
            ) : (
              <div className="students-list">
                {students.map((student) => (
                  <div
                    className="overview-content"
                    key={student.id}
                  >
                    <div className="avatar">
                      {student.name?.charAt(0) || "S"}
                    </div>
                    <div>
                      <h3>{student.name}</h3>
                      <p>{student.email}</p>
                      <p>
                        {student.course} — Semester{" "}
                        {student.semester}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="panel page-placeholder">
            <div className="overview-symbol">✦</div>
            <h2>{activePage}</h2>
            <p>
              This module will be implemented in the next
              development step.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, note }) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span>{title}</span>
        <span className="stat-icon">{icon}</span>
      </div>

      <h2>{value}</h2>
      <p>{note}</p>
    </article>
  );
}

export default App;
