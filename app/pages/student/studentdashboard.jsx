
// ─── STUDENT DASHBOARD ───────────────────────────────────────
function StudentDashboard({ user, activeTab }) {
  const [entries, setEntries] = useState([]);
  const [reports, setReports] = useState([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(null);
  const [editEntry, setEditEntry] = useState(null);
const [generating, setGenerating] = useState(false);

  const loadData = useCallback(async () => {
    if (isMockMode) {
      setEntries(MOCK_STATE.logEntries.filter(e => e.student_id === user.id));
      setReports(MOCK_STATE.weeklyReports.filter(r => r.student_id === user.id));
      return;
    }
    const [{ data: e }, { data: r }] = await Promise.all([
      supabase.from("log_entries").select().eq("student_id", user.id).order("entry_date", { ascending: false }),
      supabase.from("weekly_reports").select().eq("student_id", user.id).order("week_number", { ascending: false }),
    ]);
    setEntries(e || []);
    setReports(r || []);
  }, [user.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = {
    total: entries.length,
    approved: entries.filter(e => e.status === "approved").length,
    submitted: entries.filter(e => e.status === "submitted").length,
    weeks: reports.length,
  };

  const daysProgress = Math.min(100, Math.round((entries.filter(e => e.status === "approved").length / 120) * 100));

  if (activeTab === "logs") return <LogEntries user={user} entries={entries} onRefresh={loadData} />;
  if (activeTab === "reports") return <WeeklyReports user={user} entries={entries} reports={reports} onRefresh={loadData} />;
  if (activeTab === "profile") return <ProfilePage user={user} />;

  return (
    <div className="page animate-in">
      <div className="page-header">
        <h1>Good morning, {user.full_name.split(" ")[0]} 👋</h1>
        <p>SIWES at {user.company_name} · {fmt(user.siwes_start_date)} – {fmt(user.siwes_end_date)}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card green"><div className="stat-icon">📝</div><div className="stat-value">{stats.total}</div><div className="stat-label">Total Log Entries</div></div>
        <div className="stat-card blue"><div className="stat-icon">✅</div><div className="stat-value">{stats.approved}</div><div className="stat-label">Approved Entries</div></div>
        <div className="stat-card amber"><div className="stat-icon">⏳</div><div className="stat-value">{stats.submitted}</div><div className="stat-label">Pending Review</div></div>
        <div className="stat-card purple"><div className="stat-icon">📊</div><div className="stat-value">{stats.weeks}</div><div className="stat-label">Weekly Reports</div></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <div className="card-header"><h3>SIWES Progress</h3><span className="text-sm text-muted font-mono">{daysProgress}%</span></div>
          <div className="card-body">
            <div className="flex-center gap-2" style={{ marginBottom: 10 }}>
              <span className="text-sm text-muted">Approved Days</span>
              <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 600 }}>{stats.approved} / 120 days</span>
            </div>
            <div className="progress-bar-wrap"><div className="progress-bar" style={{ width: `${daysProgress}%` }} /></div>
            <div className="mt-2" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text3)" }}>
              <span>{fmt(user.siwes_start_date)}</span><span>{fmt(user.siwes_end_date)}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Recent Activity</h3></div>
          <div className="card-body" style={{ padding: "12px 16px" }}>
            {entries.slice(0, 4).map(e => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: e.status === "approved" ? "var(--accent-mid)" : e.status === "submitted" ? "var(--blue)" : "var(--border2)", flexShrink: 0 }} />
                <span style={{ fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.activities.slice(0, 60)}...</span>
                <span className={`badge dot ${e.status}`}>{e.status}</span>
              </div>
            ))}
            {!entries.length && <div className="empty-state"><div className="empty-icon">📓</div><h3>No entries yet</h3><p>Start logging your daily activities</p></div>}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <h3>Quick Actions</h3>
        </div>
        <div className="card-body" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={() => setShowLogModal(true)}>+ Log Today's Activity</button>
          <button className="btn btn-secondary" onClick={async () => {
            const weekEntries = entries.filter(e => e.status !== "draft").slice(0, 5);
            if (!weekEntries.length) { alert("No submitted entries to generate a report from."); return; }
            setGenerating(true);
            try {
              const summary = await generateWeeklyReport(weekEntries, user.full_name, user.company_name);
              const { start, end } = getWeekRange(weekEntries);
              const report = { id: `wr${Date.now()}`, student_id: user.id, week_number: weekNum(start), week_start: start, week_end: end, ai_summary: summary, status: "draft" };
              if (isMockMode) { MOCK_STATE.weeklyReports.push(report); setReports(r => [report, ...r]); }
              else { await supabase.from("weekly_reports").insert(report); }
              setShowReportModal(report);
              loadData();
            } catch (e) { alert("AI generation failed: " + e.message); }
            setGenerating(false);
          }} disabled={generating}>
            {generating ? <><Spinner size={13} /> Generating Report…</> : "🤖 Generate Weekly Report"}
          </button>
        </div>
      </div>

      {showLogModal && <LogEntryModal user={user} onClose={() => setShowLogModal(false)} onSaved={() => { setShowLogModal(false); loadData(); }} />}
      {showReportModal && <ReportViewModal report={showReportModal} user={user} onClose={() => setShowReportModal(null)} onRefresh={loadData} />}
    </div>
  );
}