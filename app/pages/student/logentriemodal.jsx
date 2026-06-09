function LogEntryModal({ user, entry, onClose, onSaved }) {
  const [form, setForm] = useState({
    entry_date: entry?.entry_date || new Date().toISOString().split("T")[0],
    activities: entry?.activities || "",
    skills_learned: entry?.skills_learned || "",
    challenges: entry?.challenges || "",
    attendance_status: entry?.attendance_status || "present",
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async (status = "draft") => {
    setLoading(true);
    const row = { ...form, student_id: user.id, status };
    if (isMockMode) {
      if (entry) { Object.assign(MOCK_STATE.logEntries.find(e => e.id === entry.id), row); }
      else MOCK_STATE.logEntries.push({ id: `e${Date.now()}`, ...row });
    } else {
      if (entry) await supabase.from("log_entries").eq("id", entry.id).update(row);
      else await supabase.from("log_entries").insert(row);
    }
    setLoading(false);
    onSaved();
  };

  return (
    <Modal title={entry ? "Edit Log Entry" : "New Daily Log Entry"} onClose={onClose}
      footer={<>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-secondary" onClick={() => save("draft")} disabled={loading}>Save Draft</button>
        <button className={`btn btn-primary ${loading ? "btn-loading" : ""}`} onClick={() => save("submitted")} disabled={loading}>{!loading && "Submit Entry"}</button>
      </>}>
      <div className="form-row">
        <div className="form-group"><label>Date</label><input type="date" value={form.entry_date} onChange={e => set("entry_date", e.target.value)} /></div>
        <div className="form-group"><label>Attendance</label>
          <select value={form.attendance_status} onChange={e => set("attendance_status", e.target.value)}>
            <option value="present">Present</option><option value="absent">Absent</option><option value="half-day">Half Day</option>
          </select>
        </div>
      </div>
      <div className="form-group"><label>Activities Performed *</label>
        <textarea value={form.activities} onChange={e => set("activities", e.target.value)} placeholder="Describe the technical work and activities you performed today..." />
      </div>
      <div className="form-group"><label>Skills Learned / Applied</label>
        <textarea value={form.skills_learned} onChange={e => set("skills_learned", e.target.value)} placeholder="e.g. Python scripting, database design, API integration..." style={{ minHeight: 70 }} />
      </div>
      <div className="form-group"><label>Challenges Encountered</label>
        <textarea value={form.challenges} onChange={e => set("challenges", e.target.value)} placeholder="What challenges did you face and how did you address them?" style={{ minHeight: 70 }} />
      </div>
      <div className="form-group">
        <label>Proof of Work (optional)</label>
        <div className="upload-area">
          <div className="upload-icon">📎</div>
          <p>Drag & drop files or click to upload</p>
          <small>PDF, JPG, PNG up to 10MB</small>
        </div>
        <p className="form-hint">File uploads require Supabase storage to be configured.</p>
      </div>
    </Modal>
  );
}