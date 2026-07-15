import { useState } from "react";
import { fmt, initials } from "../../utils/helper.jsx";
import Modal from "../../components/modal.jsx";

export default function SupervisorStudents({ students, entries, reports }) {
  const [selected, setSelected] = useState(null);
  return (
    <div className="page animate-in">
      <div className="page-header"><h1>Assigned Students</h1></div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Student</th><th>Matric No</th><th>Department</th><th>Total Logs</th><th>Approved</th><th>Progress</th><th>Action</th></tr></thead>
            <tbody>
              {students.map(s => {
                const se = entries.filter(e => e.student_id === s.id);
                const approved = se.filter(e => e.status === "approved").length;
                const progress = Math.min(100, Math.round((approved / 120) * 100));
                return (
                  <tr key={s.id}>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div className="avatar student" style={{ width: 28, height: 28, fontSize: 11 }}>{initials(s.full_name)}</div><span style={{ fontWeight: 500 }}>{s.full_name}</span></div></td>
                    <td className="font-mono text-sm">{s.matric_no || "—"}</td>
                    <td className="text-sm">{s.department || "—"}</td>
                    <td>{se.length}</td>
                    <td><span className="badge approved">{approved}</span></td>
                    <td style={{ minWidth: 120 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="progress-bar-wrap" style={{ flex: 1 }}><div className="progress-bar" style={{ width: `${progress}%` }} /></div>
                        <span style={{ fontSize: 11, color: "var(--text2)", width: 32, textAlign: "right" }}>{progress}%</span>
                      </div>
                    </td>
                    <td><button className="btn btn-secondary btn-sm" onClick={() => setSelected(s)}>View Details</button></td>
                  </tr>
                );
              })}
              {!students.length && <tr><td colSpan={7}><div className="empty-state"><h3>No students assigned</h3></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <Modal title={`${selected.full_name} — Student Details`} onClose={() => setSelected(null)} wide>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[["Matric No", selected.matric_no], ["Department", selected.department], ["Company", selected.company_name], ["SIWES Start", fmt(selected.siwes_start_date)], ["SIWES End", fmt(selected.siwes_end_date)]].map(([k, v]) => (
              <div key={k} style={{ padding: "12px", background: "var(--surface2)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{v || "—"}</div>
              </div>
            ))}
          </div>
          <h4 style={{ fontSize: 13, marginBottom: 10 }}>Recent Log Entries</h4>
          {entries.filter(e => e.student_id === selected.id).slice(0, 5).map(e => (
            <div key={e.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
              <span className="font-mono text-sm" style={{ width: 90, flexShrink: 0 }}>{fmt(e.entry_date)}</span>
              <span style={{ flex: 1, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.activities}</span>
              <span className={`badge dot ${e.status}`}>{e.status}</span>
            </div>
          ))}
        </Modal>
      )}
    </div>
  );
}

