import { useState, useEffect } from "react";
import { isMockMode, MOCK_STATE } from "../../data/mockdata";
import { fmt, initials } from "../../utils/helper";
import LecturerStudents from "./lecturerstudent";
import LecturerReports from "./lecturerreport";
import AuditTrail from "./audittrial";
import ProfilePage from "../profilepage";

// ─── LECTURER DASHBOARD ─────────────────────────────────────
export default function LecturerDashboard({ user, activeTab }) {
  const [students, setStudents] = useState([]);
  const [entries, setEntries] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    if (isMockMode) {
      setStudents(MOCK_STATE.users.filter(u => u.role === "student" && u.lecturer_id === user.id));
      setEntries(MOCK_STATE.logEntries);
      setReports(MOCK_STATE.weeklyReports);
    }
  }, [user.id]);

  if (activeTab === "students") return <LecturerStudents students={students} entries={entries} reports={reports} />;
  if (activeTab === "reports") return <LecturerReports students={students} entries={entries} reports={reports} />;
  if (activeTab === "audit") return <AuditTrail />;
  if (activeTab === "profile") return <ProfilePage user={user} />;

  return (
    <div className="page animate-in">
      <div className="page-header">
        <h1>Lecturer Monitoring Portal</h1>
        <p>{user.department} · Monitoring {students.length} student{students.length !== 1 ? "s" : ""}</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card blue"><div className="stat-icon">👨‍🎓</div><div className="stat-value">{students.length}</div><div className="stat-label">Assigned Students</div></div>
        <div className="stat-card green"><div className="stat-icon">📝</div><div className="stat-value">{entries.length}</div><div className="stat-label">Total Log Entries</div></div>
        <div className="stat-card purple"><div className="stat-icon">📊</div><div className="stat-value">{reports.filter(r => r.status === "approved").length}</div><div className="stat-label">Approved Reports</div></div>
        <div className="stat-card amber"><div className="stat-icon">⏳</div><div className="stat-value">{reports.filter(r => r.status === "submitted").length}</div><div className="stat-label">Pending Reports</div></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <div className="card-header"><h3>Student Compliance</h3></div>
          <div className="card-body" style={{ padding: "8px 0" }}>
            {students.map(s => {
              const se = entries.filter(e => e.student_id === s.id);
              const progress = Math.min(100, Math.round((se.filter(e => e.status === "approved").length / 120) * 100));
              const status = progress >= 80 ? "On Track" : progress >= 50 ? "Moderate" : "Needs Attention";
              const color = progress >= 80 ? "var(--accent)" : progress >= 50 ? "var(--amber)" : "var(--red)";
              return (
                <div key={s.id} style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div className="avatar student" style={{ width: 26, height: 26, fontSize: 10 }}>{initials(s.full_name)}</div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{s.full_name}</span>
                    <span style={{ marginLeft: "auto", fontSize: 11, color, fontWeight: 600 }}>{status}</span>
                  </div>
                  <div className="progress-bar-wrap"><div className="progress-bar" style={{ width: `${progress}%`, background: color }} /></div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{se.filter(e => e.status === "approved").length} / 120 days approved ({progress}%)</div>
                </div>
              );
            })}
            {!students.length && <div className="empty-state" style={{ padding: "20px" }}><h3>No students assigned</h3></div>}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Recent Approved Reports</h3></div>
          <div className="card-body" style={{ padding: "8px 0" }}>
            {reports.filter(r => r.status === "approved").slice(0, 5).map(r => {
              const student = students.find(s => s.id === r.student_id) || MOCK_STATE.users.find(u => u.id === r.student_id);
              return (
                <div key={r.id} style={{ padding: "8px 16px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, flex: 1, fontWeight: 500 }}>{student?.full_name}</span>
                    <span className="week-chip">Week {r.week_number}</span>
                    <span className="badge approved dot">approved</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>Signed {fmt(r.supervisor_signed_at)}</div>
                </div>
              );
            })}
            {!reports.filter(r => r.status === "approved").length && <div className="empty-state" style={{ padding: "20px" }}><h3>No approved reports yet</h3></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
