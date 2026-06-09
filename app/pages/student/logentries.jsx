// src/pages/student/LogEntries.jsx
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { isMockMode, MOCK_STATE } from "../../data/mockdata";
import { fmt } from "../../utils/helpers";
import Modal from "../../components/ui/Modal";
import LogEntryModal from "./LogEntryModal";

export default function LogEntries({ user, entries, onRefresh }) {
  // ... exact same function body as in the single file
}

// ─── LOG ENTRIES PAGE ───────────────────────────────────────
function LogEntries({ user, entries, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? entries : entries.filter(e => e.status === filter);

  const handleDelete = async (id) => {
    if (!confirm("Delete this entry?")) return;
    if (isMockMode) { const i = MOCK_STATE.logEntries.findIndex(e => e.id === id); if (i > -1) MOCK_STATE.logEntries.splice(i, 1); }
    else await supabase.from("log_entries").eq("id", id).delete();
    onRefresh();
  };

  const handleSubmit = async (id) => {
    if (isMockMode) { const e = MOCK_STATE.logEntries.find(e => e.id === id); if (e) e.status = "submitted"; }
    else await supabase.from("log_entries").eq("id", id).update({ status: "submitted" });
    onRefresh();
  };

  return (
    <div className="page animate-in">
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start" }}>
        <div><h1>Daily Log Entries</h1><p>Record and track your daily industrial activities</p></div>
        <button className="btn btn-primary ml-auto" onClick={() => { setEditEntry(null); setShowModal(true); }}>+ New Entry</button>
      </div>

      <div className="tabs">
        {["all", "draft", "submitted", "approved", "rejected"].map(s => (
          <button key={s} className={`tab-btn ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)} style={{ textTransform: "capitalize" }}>{s} {s !== "all" && `(${entries.filter(e => e.status === s).length})`}</button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Activities</th><th>Attendance</th><th>Status</th><th>Supervisor Comment</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td><span className="font-mono text-sm">{fmt(e.entry_date)}</span></td>
                  <td style={{ maxWidth: 280 }}><span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontSize: 13 }}>{e.activities}</span></td>
                  <td><span className={`badge ${e.attendance_status}`}>{e.attendance_status}</span></td>
                  <td><span className={`badge dot ${e.status}`}>{e.status}</span></td>
                  <td style={{ maxWidth: 200, fontSize: 12, color: "var(--text2)", fontStyle: e.supervisor_comment ? "normal" : "italic" }}>{e.supervisor_comment || "—"}</td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      {e.status === "draft" && <>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditEntry(e); setShowModal(true); }}>Edit</button>
                        <button className="btn btn-primary btn-sm" onClick={() => handleSubmit(e.id)}>Submit</button>
                      </>}
                      {e.status === "rejected" && <button className="btn btn-secondary btn-sm" onClick={() => { setEditEntry(e); setShowModal(true); }}>Revise</button>}
                      {e.status === "draft" && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e.id)}>Delete</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">📋</div><h3>No entries found</h3></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <LogEntryModal user={user} entry={editEntry} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
    </div>
  );
}