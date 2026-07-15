import { useState } from "react";
import { fmt, initials } from "../../utils/helper.jsx";
import Modal from "../../components/modal.jsx";
import Alert from "../../components/alert.jsx";

export default function LecturerReports({ students, reports }) {
  const [selected, setSelected] = useState(null);
  const allReports = reports.filter(r => students.some(s => s.id === r.student_id));
  return (
    <div className="page animate-in">
      <div className="page-header"><h1>Student Reports</h1></div>
      <div style={{ display: "grid", gap: 14 }}>
        {allReports.map(r => {
          const student = students.find(s => s.id === r.student_id);
          return (
            <div key={r.id} className="card" style={{ cursor: "pointer" }} onClick={() => setSelected(r)}>
              <div className="card-body" style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div className="avatar student" style={{ width: 40, height: 40 }}>{initials(student?.full_name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <strong>{student?.full_name}</strong>
                    <span className="week-chip">Week {r.week_number}</span>
                    <span className={`badge dot ${r.status}`}>{r.status}</span>
                  </div>
                  <span className="text-sm text-muted">{fmt(r.week_start)} — {fmt(r.week_end)}</span>
                </div>
                {r.supervisor_signed_at && <div style={{ fontSize: 11, color: "var(--accent)" }}>✍️ Supervisor Signed</div>}
                <span className="btn btn-secondary btn-sm">View</span>
              </div>
            </div>
          );
        })}
        {!allReports.length && <div className="card"><div className="empty-state"><h3>No reports available</h3></div></div>}
      </div>
      {selected && (
        <Modal title={`Week ${selected.week_number} Report`} onClose={() => setSelected(null)} wide>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <span className="week-chip">{fmt(selected.week_start)} — {fmt(selected.week_end)}</span>
            <span className={`badge dot ${selected.status}`}>{selected.status}</span>
            <span className="ai-badge">🤖 AI Generated</span>
          </div>
          <div className="form-group"><label>Weekly Summary</label><div className="report-body">{selected.ai_summary}</div></div>
          {selected.student_review && <div className="form-group"><label>Student's Notes</label><div className="report-body" style={{ fontSize: 13 }}>{selected.student_review}</div></div>}
          {selected.supervisor_comment && <div style={{ marginTop: 12 }}><Alert type="success"><strong>Supervisor Comment:</strong> {selected.supervisor_comment}</Alert></div>}
          {selected.supervisor_signed_at && <div className="signature-line mt-3"><strong style={{ fontSize: 12 }}>✍️ Digitally signed by supervisor</strong><br /><span style={{ fontSize: 11 }}>Signed: {fmt(selected.supervisor_signed_at)}</span></div>}
        </Modal>
      )}
    </div>
  );
}