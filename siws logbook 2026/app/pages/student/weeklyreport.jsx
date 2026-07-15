import { useState } from "react";
import { supabase } from "../../lib/supabase.jsx";
import { isMockMode, MOCK_STATE } from "../../data/mockdata.jsx";
import { fmt, weekNum, getWeekRange } from "../../utils/helper.jsx";
import { generateWeeklyReport } from "../../lib/ai.jsx";
import Alert from "../../components/alert.jsx";
import Spinner from "../../components/spinner.jsx";
import Modal from "../../components/modal.jsx";
import { showToast } from '../../components/toast.jsx'

export function ReportViewModal({ report, user, onClose, onRefresh }) {
  const [review, setReview] = useState(report.student_review || "");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    const upd = { status: "submitted", student_review: review };
    if (isMockMode) {
      const r = MOCK_STATE.weeklyReports.find((entry) => entry.id === report.id);
      if (r) Object.assign(r, upd);
    } else {
      await supabase.from("weekly_reports").eq("id", report.id).update(upd);
      if (error) {
        showToast("Failed to submit report: " + error.message, "error");
        setLoading(false);
        return;
      }
    }
    showToast("Weekly report submitted successfully!", "success");
    setLoading(false);
    onRefresh();
    onClose();
  };

  return (
    <Modal
      title={`Week ${report.week_number} — AI Report`}
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          {report.status === "draft" && (
            <button
              className={`btn btn-primary ${loading ? "btn-loading" : ""}`}
              onClick={submit}
              disabled={loading}
            >
              {!loading && "Submit to Supervisor"}
            </button>
          )}
        </>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <span className="week-chip">
            📅 {fmt(report.week_start)} — {fmt(report.week_end)}
          </span>
          <span className={`badge dot ${report.status}`}>{report.status}</span>
          <span className="ai-badge">🤖 AI Generated</span>
        </div>
      </div>
      <div className="form-group">
        <label>AI-Generated Summary</label>
        <div className="report-body">{report.ai_summary}</div>
      </div>
      {report.status === "draft" && (
        <div className="form-group">
          <label>Your Review / Additional Notes</label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Add any personal observations, corrections, or additional context..."
          />
        </div>
      )}
      {report.supervisor_comment && (
        <div style={{ marginTop: 16 }}>
          <Alert type="info">
            <strong>Supervisor Feedback:</strong> {report.supervisor_comment}
          </Alert>
        </div>
      )}
      {report.supervisor_signed_at && (
        <div className="signature-line mt-3">
          <strong style={{ fontSize: 12 }}>✍️ Digitally signed by supervisor</strong>
          <br />
          <span style={{ fontSize: 11 }}>{fmt(report.supervisor_signed_at)}</span>
        </div>
      )}
    </Modal>
  );
}



export default function WeeklyReports({ user, entries, reports, onRefresh }) {
  const [showModal, setShowModal] = useState(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    const eligible = entries.filter((e) => e.status !== "draft");
    if (eligible.length < 3) {
      alert("You need at least 3 submitted/approved entries to generate a weekly report.");
      return;
    }
    setGenerating(true);
    try {
      const summary = await generateWeeklyReport(eligible.slice(0, 5), user.full_name, user.company_name);
      if (!summary.trim()) {
        throw new Error('AI generated an empty report summary. Report was not submitted.')
      }
      const { start, end } = getWeekRange(eligible.slice(0, 5));
      const report = {
        student_id: user.id,
        week_number: weekNum(start),
        week_start: start,
        week_end: end,
        ai_summary: summary,
        status: "draft",
      };
      if (isMockMode) {
        report.id = `wr${Date.now()}`;
        MOCK_STATE.weeklyReports.push(report);
      } else {
        await supabase.from("weekly_reports").insert(report);
      }
      onRefresh();
      setShowModal(report);
    } catch (e) {
      alert("AI generation failed: " + e.message);
    }
    setGenerating(false);
  };

  return (
    <div className="page animate-in">
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start" }}>
        <div>
          <h1>Weekly Reports</h1>
          <p>AI-generated summaries of your weekly activities</p>
        </div>
        <button className="btn btn-primary ml-auto" onClick={handleGenerate} disabled={generating} style={{ gap: 8 }}>
          {generating ? (
            <>
              <Spinner size={13} /> Generating…
            </>
          ) : (
            "🤖 Generate New Report"
          )}
        </button>
      </div>
      <div style={{ marginBottom: 16 }}>
        <Alert type="info">
          Weekly reports are automatically generated by AI from your daily log entries. Review and edit before
          submitting to your supervisor.
        </Alert>
      </div>
      <div style={{ display: "grid", gap: 14 }}>
        {reports.map((r) => (
          <div key={r.id} className="card" style={{ cursor: "pointer" }} onClick={() => setShowModal(r)}>
            <div className="card-body" style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: "var(--accent-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                📊
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <strong style={{ fontSize: 14 }}>Week {r.week_number} Report</strong>
                  <span className={`badge dot ${r.status}`}>{r.status}</span>
                  <span className="ai-badge">🤖 AI Generated</span>
                </div>
                <span className="text-sm text-muted">
                  {fmt(r.week_start)} — {fmt(r.week_end)}
                </span>
                {r.supervisor_comment && (
                  <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>
                    Supervisor: {r.supervisor_comment}
                  </div>
                )}
              </div>
              {r.supervisor_signed_at && (
                <div className="signature-line text-sm" style={{ borderTop: "none", paddingTop: 0 }}>
                  ✍️ Signed {fmt(r.supervisor_signed_at)}
                </div>
              )}
              <span className="btn btn-secondary btn-sm">View →</span>
            </div>
          </div>
        ))}
        {!reports.length && (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>No weekly reports yet</h3>
              <p>Generate your first AI-powered weekly report</p>
            </div>
          </div>
        )}
      </div>
      {showModal && (
        <ReportViewModal report={showModal} user={user} onClose={() => setShowModal(null)} onRefresh={onRefresh} />
      )}
    </div>
  );
}
