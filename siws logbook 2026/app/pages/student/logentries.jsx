import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase.jsx'
import { isMockMode, MOCK_STATE } from '../../data/mockdata.jsx'
import { fmt } from '../../utils/helper.jsx'
import LogEntryModal from './logentriemodal.jsx'
import { showToast } from '../../components/toast.jsx'

export default function LogEntries({ user }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editEntry, setEditEntry] = useState(null)
  const [filter, setFilter] = useState('all')
  const [selectedEntry, setSelectedEntry] = useState(null) // for detail view

  // ── FETCH ALL ENTRIES FOR THIS STUDENT ───────────────────
  const loadEntries = useCallback(async () => {
    setLoading(true)
    if (isMockMode) {
      setEntries(MOCK_STATE.logEntries.filter(e => e.student_id === user.id))
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('log_entries')
      .select()
      .eq('student_id', user.id)
      .order('entry_date', { ascending: false })

    if (error) {
      showToast('Failed to load entries: ' + error.message, 'error')
    } else {
      setEntries(data || [])
    }
    setLoading(false)
  }, [user.id])

  useEffect(() => { loadEntries() }, [loadEntries])

  const filtered = filter === 'all'
    ? entries
    : entries.filter(e => e.status === filter)

  const counts = {
    all:       entries.length,
    draft:     entries.filter(e => e.status === 'draft').length,
    submitted: entries.filter(e => e.status === 'submitted').length,
    approved:  entries.filter(e => e.status === 'approved').length,
    rejected:  entries.filter(e => e.status === 'rejected').length,
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this draft entry?')) return
    if (isMockMode) {
      const i = MOCK_STATE.logEntries.findIndex(e => e.id === id)
      if (i > -1) MOCK_STATE.logEntries.splice(i, 1)
    } else {
      const { error } = await supabase.from('log_entries').eq('id', id).delete()
      if (error) { showToast('Delete failed: ' + error.message, 'error'); return }
    }
    showToast('Entry deleted.', 'info')
    loadEntries()
  }

  const handleSubmit = async (id) => {
    if (isMockMode) {
      const e = MOCK_STATE.logEntries.find(e => e.id === id)
      if (e) e.status = 'submitted'
    } else {
      const { error } = await supabase
        .from('log_entries')
        .eq('id', id)
        .update({ status: 'submitted' })
      if (error) { showToast('Submit failed: ' + error.message, 'error'); return }
    }
    showToast('Entry submitted successfully!', 'success')
    loadEntries()
  }

  const statusColor = {
    draft:     '#9ca3af',
    submitted: '#3b82f6',
    approved:  '#16a34a',
    rejected:  '#dc2626',
  }

  return (
    <div className="page animate-in">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div>
          <h1>Daily Log Entries</h1>
          <p>Record and track your daily industrial activities</p>
        </div>
        <button
          className="btn btn-primary ml-auto"
          onClick={() => { setEditEntry(null); setShowModal(true) }}
        >
          + New Entry
        </button>
      </div>

      {/* Filter tabs */}
      <div className="tabs">
        {['all', 'draft', 'submitted', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            className={`tab-btn ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
            style={{ textTransform: 'capitalize' }}
          >
            {s} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>
          <div style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--accent-mid)', borderRadius: '50%', animation: 'spin 0.6s linear infinite', margin: '0 auto 12px' }} />
          Loading entries…
        </div>
      )}

      {/* Entries list */}
      {!loading && (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map(e => (
            <div
              key={e.id}
              className="card"
              style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}
              onClick={() => setSelectedEntry(e)}
              onMouseEnter={el => el.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
              onMouseLeave={el => el.currentTarget.style.boxShadow = ''}
            >
              <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {/* Date column */}
                <div style={{
                  flexShrink: 0, width: 56, height: 56,
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 12, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--text)', lineHeight: 1 }}>
                    {new Date(e.entry_date).getDate()}
                  </span>
                  <span style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {new Date(e.entry_date).toLocaleString('en-NG', { month: 'short' })}
                  </span>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span className={`badge dot ${e.status}`}>{e.status}</span>
                    <span className={`badge ${e.attendance_status}`}>{e.attendance_status}</span>
                    {e.supervisor_comment && (
                      <span style={{ fontSize: 11, color: 'var(--text2)' }}>💬 Supervisor commented</span>
                    )}
                  </div>
                  <p style={{
                    fontSize: 13, color: 'var(--text)',
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    marginBottom: e.skills_learned ? 6 : 0
                  }}>
                    {e.activities}
                  </p>
                  {e.skills_learned && (
                    <p style={{ fontSize: 12, color: 'var(--text2)' }}>
                      🎯 <em>{e.skills_learned}</em>
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={ev => ev.stopPropagation()}>
                  {e.status === 'draft' && (
                    <>
                      <button className="btn btn-secondary btn-sm"
                        onClick={() => { setEditEntry(e); setShowModal(true) }}>
                        Edit
                      </button>
                      <button className="btn btn-primary btn-sm"
                        onClick={() => handleSubmit(e.id)}>
                        Submit
                      </button>
                      <button className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(e.id)}>
                        ✕
                      </button>
                    </>
                  )}
                  {e.status === 'rejected' && (
                    <button className="btn btn-secondary btn-sm"
                      onClick={() => { setEditEntry(e); setShowModal(true) }}>
                      Revise
                    </button>
                  )}
                  {(e.status === 'submitted' || e.status === 'approved') && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelectedEntry(e)}>
                      View →
                    </button>
                  )}
                </div>
              </div>

              {/* Supervisor comment bar — shown inline for quick visibility */}
              {e.supervisor_comment && (
                <div style={{
                  borderTop: '1px solid var(--border)',
                  padding: '10px 20px',
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                  background: e.status === 'approved' ? 'var(--accent-light)' : e.status === 'rejected' ? 'var(--red-light)' : 'var(--surface2)',
                }}>
                  <span style={{ fontSize: 13, flexShrink: 0 }}>
                    {e.status === 'approved' ? '✅' : e.status === 'rejected' ? '❌' : '💬'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
                    <strong>Supervisor:</strong> {e.supervisor_comment}
                  </span>
                </div>
              )}
            </div>
          ))}

          {!filtered.length && !loading && (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">
                  {filter === 'submitted' ? '📤' : filter === 'approved' ? '✅' : filter === 'rejected' ? '❌' : '📋'}
                </div>
                <h3>
                  {filter === 'all' ? 'No entries yet' : `No ${filter} entries`}
                </h3>
                <p>
                  {filter === 'submitted' ? 'Submit a draft entry to see it here.' :
                   filter === 'approved' ? 'Your supervisor has not approved any entries yet.' :
                   filter === 'all' ? 'Click "+ New Entry" to log your first activity.' :
                   `No entries with status "${filter}".`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail modal — shows full entry including supervisor feedback */}
      {selectedEntry && (
        <EntryDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}

      {showModal && (
        <LogEntryModal
          user={user}
          entry={editEntry}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); loadEntries() }}
        />
      )}
    </div>
  )
}

// ── ENTRY DETAIL MODAL ────────────────────────────────────────
// Students click any submitted/approved entry to see full details
// including the supervisor's comment and current status.
function EntryDetailModal({ entry, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-in" style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <div>
            <h3>Log Entry — {fmt(entry.entry_date)}</h3>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <span className={`badge dot ${entry.status}`}>{entry.status}</span>
              <span className={`badge ${entry.attendance_status}`}>{entry.attendance_status}</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {/* Supervisor feedback banner — most important for student to see */}
          {entry.supervisor_comment && (
            <div className={`alert ${entry.status === 'approved' ? 'success' : entry.status === 'rejected' ? 'error' : 'info'}`}
              style={{ marginBottom: 20 }}>
              <span style={{ fontSize: 16 }}>
                {entry.status === 'approved' ? '✅' : entry.status === 'rejected' ? '❌' : '💬'}
              </span>
              <div>
                <strong>Supervisor Feedback</strong>
                <p style={{ marginTop: 4, fontWeight: 400 }}>{entry.supervisor_comment}</p>
              </div>
            </div>
          )}

          {entry.status === 'submitted' && !entry.supervisor_comment && (
            <div className="alert info" style={{ marginBottom: 20 }}>
              <span>⏳</span>
              <span>This entry is awaiting review by your supervisor.</span>
            </div>
          )}

          <div className="form-group">
            <label>Activities Performed</label>
            <div className="report-body" style={{ fontSize: 13 }}>{entry.activities}</div>
          </div>

          {entry.skills_learned && (
            <div className="form-group">
              <label>Skills Learned / Applied</label>
              <div style={{
                fontSize: 13, padding: '10px 14px',
                background: 'var(--surface2)', borderRadius: 8,
                border: '1px solid var(--border)', lineHeight: 1.6,
              }}>
                {entry.skills_learned}
              </div>
            </div>
          )}

          {entry.challenges && (
            <div className="form-group">
              <label>Challenges Encountered</label>
              <div style={{
                fontSize: 13, padding: '10px 14px',
                background: 'var(--surface2)', borderRadius: 8,
                border: '1px solid var(--border)', lineHeight: 1.6,
              }}>
                {entry.challenges}
              </div>
            </div>
          )}

          <div style={{
            marginTop: 16, padding: '12px 14px',
            background: 'var(--surface2)', borderRadius: 8,
            border: '1px solid var(--border)',
            display: 'flex', gap: 24, fontSize: 12, color: 'var(--text2)',
          }}>
            <span>📅 <strong>Date:</strong> {fmt(entry.entry_date)}</span>
            <span>🕐 <strong>Submitted:</strong> {entry.created_at ? fmt(entry.created_at) : '—'}</span>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}