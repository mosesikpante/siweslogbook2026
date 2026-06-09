import { useState } from "react";
import { fmt, initials } from "../../utils/helper";
import Modal from "../../components/modal";
import Alert from "../../components/alert";

export default function LecturerStudents({ students, entries, reports }) {
  const [selected, setSelected] = useState(null);
  return (
    <div className="page animate-in">
      <div className="page-header"><h1>Student Monitoring</h1></div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Student</th><th>Matric No</th><th>Company</th><th>Total Logs</th><th>Approved</th><th>Reports</th><th>Compliance</th><th>Action</th></tr></thead>
            <tbody>
              {students.map(s => {
                const se = entries.filter(e => e.student_id === s.id);
                const approved = se.filter(e => e.status === "approved").length;
                const progress = Math.min(100, Math.round((approved / 120) * 100));
                const sr = reports.filter(r => r.student_id === s.id);
                return (
                  <tr key={s.id}>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div className="avatar student" style={{ width: 28, height: 28, fontSize: 11 }}>{initials(s.full_name)}</div><span style={{ fontWeight: 500 }}>{s.full_name}</span></div></td>
                    <td className="font-mono text-sm">{s.matric_no}</td>
                    <td className="text-sm">{s.company_name}</td>
                    <td>{se.length}</td>
                    <td><span className="badge approved">{approved}</span></td>
                    <td>{sr.length} ({sr.filter(r => r.status === "approved").length} signed)</td>
                    <td><span style={{ fontSize: 12, fontWeight: 600, color: progress >= 70 ? "var(--accent)" : "var(--amber)" }}>{progress}%</span></td>
                    <td><button className="btn btn-secondary btn-sm" onClick={() => setSelected(s)}>View</button></td>
                  </tr>
                );
              })}
              {!students.length && <tr><td colSpan={8}><div className="empty-state"><h3>No students assigned</h3></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {selected && (
        <Modal title={`${selected.full_name} — SIWES Record`} onClose={() => setSelected(null)} wide>
          <div style={{ marginBottom: 20 }}>
            <Alert type="info">Monitoring read-only view. Only the assigned supervisor can approve entries.</Alert>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[["Matric No", selected.matric_no], ["Department", selected.department], ["Company", selected.company_name], ["SIWES Start", fmt(selected.siwes_start_date)], ["SIWES End", fmt(selected.siwes_end_date)], ["Status", "Active"]].map(([k, v]) => (
              <div key={k} style={{ padding: 12, background: "var(--surface2)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{v || "—"}</div>
              </div>
            ))}
          </div>
          <h4 style={{ fontSize: 13, marginBottom: 10 }}>All Log Entries</h4>
          {entries.filter(e => e.student_id === selected.id).map(e => (
            <div key={e.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)", alignItems: "flex-start" }}>
              <span className="font-mono text-sm" style={{ width: 90, flexShrink: 0 }}>{fmt(e.entry_date)}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12 }}>{e.activities}</div>
                {e.supervisor_comment && <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>💬 {e.supervisor_comment}</div>}
              </div>
              <span className={`badge dot ${e.status}`}>{e.status}</span>
            </div>
          ))}
        </Modal>
      )}
    </div>
  );
}