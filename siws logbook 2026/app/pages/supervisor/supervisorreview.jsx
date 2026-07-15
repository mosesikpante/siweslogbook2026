import { useState } from "react";
import { supabase } from "../../lib/supabase.jsx";
import { isMockMode, MOCK_STATE } from "../../data/mockdata.jsx";
import { fmt, initials } from "../../utils/helper.jsx";
import Modal from "../../components/modal.jsx";
import { showToast } from '../../components/toast.jsx'


export default function SupervisorReview({ user, entries, reports, students, onRefresh }) {
  const [activeTab, setActiveTab] = useState("entries");
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const pending = entries.filter(e => e.status === "submitted");

  const reviewEntry = async (id, action) => {
    setLoading(true);
    const upd = { status: action, supervisor_comment: comment };
    if (isMockMode) {
      const e = MOCK_STATE.logEntries.find(e => e.id === id);
      if (e) Object.assign(e, upd);
    } else {
      const { error } = await supabase
        .from("log_entries")
        .eq("id", id)
        .update({ ...upd, updated_at: new Date().toISOString() });
      if (error) {
        alert("Failed to update entry: " + error.message);
        setLoading(false);
        return;
      }
    }
    showToast(`Log entry ${action === "approved" ? "approved" : "rejected"} successfully!`, "success");
const signReport = async (id)=> {
  showToast('Report signed and aprroved!', 'success')
}
    setComment(""); setSelected(null); setLoading(false);
    onRefresh();
  }

  const signReport = async (id) => {
    setLoading(true);
    const upd = { status: "approved", supervisor_comment: comment, supervisor_signed_at: new Date().toISOString() };
    if (isMockMode) {
      const r = MOCK_STATE.weeklyReports.find(r => r.id === id);
      if (r) Object.assign(r, upd);
    } else {
      const { error } = await supabase
        .from("weekly_reports")
        .eq("id", id)
        .update(upd);
      if (error) {
        alert("Failed to sign report: " + error.message);
        setLoading(false);
        return;
      }
    }

    setComment(""); setSelected(null); setLoading(false);
    onRefresh();
  }

  return (
    <div className="page animate-in">
      <div className="page-header"><h1>Review & Approval</h1><p>Review student submissions and provide feedback</p></div>
      <div className="tabs">
        <button className={`tab-btn ${activeTab === "entries" ? "active" : ""}`} onClick={() => setActiveTab("entries")}>Log Entries ({pending.length})</button>
        <button className={`tab-btn ${activeTab === "reports" ? "active" : ""}`} onClick={() => setActiveTab("reports")}>Weekly Reports ({reports.filter(r => r.status === "submitted").length})</button>
      </div>

      {activeTab === "entries" && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Student</th><th>Date</th><th>Activities</th><th>Attendance</th><th>Status</th><th style={{ textAlign: "right" }}>Action</th></tr></thead>
              <tbody>
                {entries.filter(e => e.status !== "draft").map(e => {
                  const student = students.find(s => s.id === e.student_id) || MOCK_STATE.users.find(u => u.id === e.student_id);
                  return (
                    <tr key={e.id}>
                      <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div className="avatar student" style={{ width: 24, height: 24, fontSize: 10 }}>{initials(student?.full_name)}</div><span>{student?.full_name}</span></div></td>
                      <td className="font-mono text-sm">{fmt(e.entry_date)}</td>
                      <td style={{ maxWidth: 220 }}><span style={{ fontSize: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{e.activities}</span></td>
                      <td><span className={`badge ${e.attendance_status}`}>{e.attendance_status}</span></td>
                      <td><span className={`badge dot ${e.status}`}>{e.status}</span></td>
                      <td style={{ textAlign: "right" }}>
                        {e.status === "submitted" && <button className="btn btn-secondary btn-sm" onClick={() => setSelected(e)}>Review</button>}
                        {e.status === "approved" && <span style={{ fontSize: 11, color: "var(--text3)" }}>✅ Approved</span>}
                        {e.status === "rejected" && <span style={{ fontSize: 11, color: "var(--red)" }}>❌ Rejected</span>}
                      </td>
                    </tr>
                  );
                })}
                {!entries.length && <tr><td colSpan={6}><div className="empty-state"><h3>No entries to review</h3></div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "reports" && (
        <div style={{ display: "grid", gap: 14 }}>
          {reports.filter(r => r.status !== "draft").map(r => {
            const student = students.find(s => s.id === r.student_id) || MOCK_STATE.users.find(u => u.id === r.student_id);
            return (
              <div key={r.id} className="card">
                <div className="card-body" style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 4, alignItems: "center" }}>
                      <strong style={{ fontSize: 14 }}>Week {r.week_number} — {student?.full_name}</strong>
                      <span className={`badge dot ${r.status}`}>{r.status}</span>
                    </div>
                    <span className="text-sm text-muted">{fmt(r.week_start)} — {fmt(r.week_end)}</span>
                    <div className="report-body mt-2" style={{ fontSize: 12, maxHeight: 60, overflow: "hidden" }}>{r.ai_summary?.slice(0, 200)}…</div>
                  </div>
                  {r.status === "submitted" && <button className="btn btn-primary btn-sm" onClick={() => setSelected({ ...r, _type: "report" })}>Review & Sign</button>}
                  {r.status === "approved" && <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>✍️ Signed</span>}
                </div>
              </div>
            );
          })}
          {!reports.filter(r => r.status !== "draft").length && <div className="card"><div className="empty-state"><h3>No reports submitted yet</h3></div></div>}
        </div>
      )}

      {selected && (
        <Modal title={selected._type === "report" ? "Review Weekly Report" : "Review Log Entry"} onClose={() => { setSelected(null); setComment(""); }} wide
          footer={<>
            <button className="btn btn-secondary" onClick={() => { setSelected(null); setComment(""); }}>Cancel</button>
            {selected._type !== "report" && <button className={`btn btn-danger ${loading ? "btn-loading" : ""}`} onClick={() => reviewEntry(selected.id, "rejected")} disabled={loading}>{!loading && "Reject"}</button>}
            {selected._type === "report"
              ? <button className={`btn btn-primary ${loading ? "btn-loading" : ""}`} onClick={() => signReport(selected.id)} disabled={loading}>{!loading && "✍️ Sign & Approve Report"}</button>
              : <button className={`btn btn-primary ${loading ? "btn-loading" : ""}`} onClick={() => reviewEntry(selected.id, "approved")} disabled={loading}>{!loading && "Approve"}</button>
            }
          </>}>
          {selected._type === "report" ? (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <span className="week-chip">Week {selected.week_number}</span>
                <span className="week-chip">{fmt(selected.week_start)} — {fmt(selected.week_end)}</span>
              </div>
              <div className="form-group"><label>AI-Generated Summary</label><div className="report-body">{selected.ai_summary}</div></div>
              {selected.student_review && <div className="form-group"><label>Student's Review</label><div className="report-body" style={{ fontSize: 13 }}>{selected.student_review}</div></div>}
            </>
          ) : (
            <>
              <div className="form-row">
                <div><span className="text-sm text-muted">Date</span><p style={{ marginTop: 4 }}><strong>{fmt(selected.entry_date)}</strong></p></div>
                <div><span className="text-sm text-muted">Attendance</span><p style={{ marginTop: 4 }}><span className={`badge ${selected.attendance_status}`}>{selected.attendance_status}</span></p></div>
              </div>
              <div className="form-group mt-3"><label>Activities</label><div className="report-body" style={{ fontSize: 13 }}>{selected.activities}</div></div>
              {selected.skills_learned && <div className="form-group"><label>Skills Learned</label><div style={{ fontSize: 13, padding: "8px 12px", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)" }}>{selected.skills_learned}</div></div>}
              {selected.challenges && <div className="form-group"><label>Challenges</label><div style={{ fontSize: 13, padding: "8px 12px", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)" }}>{selected.challenges}</div></div>}
            </>
          )}
          <div className="form-group mt-3"><label>Your Feedback / Comment</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Provide feedback or comments for the student..." />
          </div>
        </Modal>
      )}
    </div>
  );
}