import { useState, useEffect } from "react";
import { isMockMode, MOCK_STATE } from "../../data/mockdata";
import { fmt, initials } from "../../utils/helper";
import SupervisorReview from "./supervisorreview";
import SupervisorStudents from "./supervisorstudent";
import ProfilePage from "../profilepage";

// ─── SUPERVISOR DASHBOARD ───────────────────────────────────
export default function SupervisorDashboard({ user, activeTab }) {
  const [students, setStudents] = useState([]);
  const [entries, setEntries] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    if (isMockMode) {
      setStudents(MOCK_STATE.users.filter(u => u.role === "student" && u.supervisor_id === user.id));
      setEntries(MOCK_STATE.logEntries);
      setReports(MOCK_STATE.weeklyReports);
    }
  }, [user.id]);

  const pendingEntries = entries.filter(e => e.status === "submitted");
  const pendingReports = reports.filter(r => r.status === "submitted");

  if (activeTab === "review") return <SupervisorReview user={user} entries={entries} reports={reports} students={students} onRefresh={() => {
    setEntries([...MOCK_STATE.logEntries]);
    setReports([...MOCK_STATE.weeklyReports]);
  }} />;
  if (activeTab === "students") return <SupervisorStudents students={students} entries={entries} reports={reports} />;
  if (activeTab === "profile") return <ProfilePage user={user} />;

  return (
    <div className="page animate-in">
      <div className="page-header">
        <h1>Supervisor Portal</h1>
        <p>{user.company_name} · {students.length} student{students.length !== 1 ? "s" : ""} assigned</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card blue"><div className="stat-icon">👨‍🎓</div><div className="stat-value">{students.length}</div><div className="stat-label">Assigned Students</div></div>
        <div className="stat-card amber"><div className="stat-icon">⏳</div><div className="stat-value">{pendingEntries.length}</div><div className="stat-label">Pending Log Reviews</div></div>
        <div className="stat-card purple"><div className="stat-icon">📊</div><div className="stat-value">{pendingReports.length}</div><div className="stat-label">Reports to Sign</div></div>
        <div className="stat-card green"><div className="stat-icon">✅</div><div className="stat-value">{entries.filter(e => e.status === "approved").length}</div><div className="stat-label">Approved Entries</div></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <div className="card-header"><h3>Pending Reviews</h3>{pendingEntries.length > 0 && <span className="nav-badge">{pendingEntries.length}</span>}</div>
          <div className="card-body" style={{ padding: "8px 0" }}>
            {pendingEntries.slice(0, 5).map(e => {
              const student = students.find(s => s.id === e.student_id) || MOCK_STATE.users.find(u => u.id === e.student_id);
              return (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", borderBottom: "1px solid var(--border)" }}>
                  <div className={`avatar ${student?.role || "student"}`} style={{ width: 28, height: 28, fontSize: 11 }}>{initials(student?.full_name || "?")}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{student?.full_name}</div>
                    <div style={{ fontSize: 11, color: "var(--text2)" }}>{fmt(e.entry_date)}</div>
                  </div>
                  <span className="badge dot submitted">submitted</span>
                </div>
              );
            })}
            {!pendingEntries.length && <div className="empty-state" style={{ padding: "20px" }}><h3>All caught up!</h3></div>}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3>Students Overview</h3></div>
          <div className="card-body" style={{ padding: "8px 0" }}>
            {students.map(s => {
              const sEntries = entries.filter(e => e.student_id === s.id);
              const progress = Math.min(100, Math.round((sEntries.filter(e => e.status === "approved").length / 120) * 100));
              return (
                <div key={s.id} style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div className="avatar student" style={{ width: 28, height: 28, fontSize: 11 }}>{initials(s.full_name)}</div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{s.full_name}</span>
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text2)" }}>{progress}%</span>
                  </div>
                  <div className="progress-bar-wrap"><div className="progress-bar" style={{ width: `${progress}%` }} /></div>
                </div>
              );
            })}
            {!students.length && <div className="empty-state" style={{ padding: "20px" }}><h3>No students assigned</h3></div>}
          </div>
        </div>
      </div>
    </div>
  );
}