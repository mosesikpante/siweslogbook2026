import { useState, useRef } from 'react'
import { supabase } from "../../lib/supabase.jsx";
import { isMockMode, MOCK_STATE } from "../../data/mockdata.jsx";
import Modal from "../../components/modal.jsx";
import Spinner from "../../components/spinner.jsx";
import { showToast } from '../../components/toast.jsx'

const BUCKET = 'attachments' // ← change this if your bucket has a different name
const MAX_FILE_MB = 10
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']

export default function LogEntryModal({ user, entry, onClose, onSaved }) {
  const [form, setForm] = useState({
    entry_date:        entry?.entry_date        || new Date().toISOString().split('T')[0],
    activities:        entry?.activities        || '',
    skills_learned:    entry?.skills_learned    || '',
    challenges:        entry?.challenges        || '',
    attendance_status: entry?.attendance_status || 'present',
  })
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState([]) // { id, file, name, size, status: 'pending'|'uploading'|'done'|'error', url, error }
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const validateEntry = (row) => {
    if (row.status === 'submitted' && !row.activities?.trim()) {
      return 'Please add activities performed before submitting this daily log entry.'
    }
    return null
  }

  // ── FILE SELECTION ──────────────────────────────────────
  const addFiles = (fileList) => {
    const incoming = Array.from(fileList)
    const validated = incoming.map((file) => {
      const id = `f${Date.now()}_${Math.random().toString(36).slice(2)}`
      let error = null
      if (!ACCEPTED_TYPES.includes(file.type)) error = 'Unsupported file type'
      else if (file.size > MAX_FILE_MB * 1024 * 1024) error = `File exceeds ${MAX_FILE_MB}MB`
      return {
        id,
        file,
        name: file.name,
        size: file.size,
        status: error ? 'error' : 'pending',
        error,
        url: null,
      }
    })
    setFiles((f) => [...f, ...validated])
  }

  const handleInputChange = (e) => {
    if (e.target.files?.length) addFiles(e.target.files)
    e.target.value = '' // allow re-selecting the same file
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  const removeFile = (id) => setFiles((f) => f.filter((x) => x.id !== id))

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // ── UPLOAD ALL PENDING FILES ─────────────────────────────
  const uploadFiles = async (entryId) => {
    const pending = files.filter((f) => f.status === 'pending')
    if (!pending.length) return []

    const uploaded = []

    for (const f of pending) {
      setFiles((curr) => curr.map((x) => (x.id === f.id ? { ...x, status: 'uploading' } : x)))

      try {
        const safeName = f.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
        const path = `${user.id}/${entryId}/${Date.now()}_${safeName}`

        if (isMockMode) {
          // No real storage in demo mode — fake a local object URL instead
          const url = URL.createObjectURL(f.file)
          await new Promise((r) => setTimeout(r, 500)) // simulate latency
          uploaded.push({ name: f.name, url, type: f.file.type })
          setFiles((curr) => curr.map((x) => (x.id === f.id ? { ...x, status: 'done', url } : x)))
        } else {
          const { error } = await supabase.storage.from(BUCKET).upload(path, f.file)
          if (error) throw new Error(error.message || 'Upload failed')

          const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
          uploaded.push({ name: f.name, url: data.publicUrl, type: f.file.type })
          setFiles((curr) => curr.map((x) => (x.id === f.id ? { ...x, status: 'done', url: data.publicUrl } : x)))
        }
      } catch (err) {
        setFiles((curr) => curr.map((x) => (x.id === f.id ? { ...x, status: 'error', error: err.message } : x)))
      }
    }

    return uploaded
  }

  // ── SAVE ENTRY (+ attachments) ───────────────────────────
  const save = async (status = 'draft') => {
    const hasErrors = files.some((f) => f.status === 'error')
    if (hasErrors && !confirm('Some files failed validation and will be skipped. Continue saving?')) return

    const row = {
      ...form,
      activities: form.activities.trim(),
      skills_learned: form.skills_learned.trim(),
      challenges: form.challenges.trim(),
      student_id: user.id,
      status,
    }

    const validationError = validateEntry(row)
    if (validationError) {
      alert(validationError)
      return
    }

    setLoading(true)

    try {
      let entryId = entry?.id

      if (isMockMode) {
        if (entry) {
          Object.assign(MOCK_STATE.logEntries.find((e) => e.id === entry.id), row)
        } else {
          entryId = `e${Date.now()}`
          MOCK_STATE.logEntries.push({ id: entryId, ...row })
        }
      } else {
        if (entry) {
          await supabase.from('log_entries').eq('id', entry.id).update(row)
        } else {
          const { data } = await supabase.from('log_entries').insert(row)
          entryId = data?.[0]?.id
        }
      }
      if ( status === 'submitted') {
        showToast("Daily log entry submitted successfully!", "success");
      } else {
        showToast("Daily log entry saved as draft.", "success");
      }
      setLoading(false)
      onSaved()
    

      // Upload any pending files now that we have an entry ID
      if (entryId && files.some((f) => f.status === 'pending')) {
        const uploaded = await uploadFiles(entryId)

        if (isMockMode) {
          MOCK_STATE.attachments = MOCK_STATE.attachments || []
          uploaded.forEach((u) =>
            MOCK_STATE.attachments.push({
              id: `att${Date.now()}_${Math.random().toString(36).slice(2)}`,
              log_entry_id: entryId,
              file_name: u.name,
              file_url: u.url,
              file_type: u.type,
              uploaded_by: user.id,
            })
          )
        } else {
          await Promise.all(
            uploaded.map((u) =>
              supabase.from('attachments').insert({
                log_entry_id: entryId,
                file_name: u.name,
                file_url: u.url,
                file_type: u.type,
                uploaded_by: user.id,
              })
            )
          )
        }
      }

      setLoading(false)
      onSaved()
    } catch (err) {
      setLoading(false)
      alert('Failed to save entry: ' + err.message)
    }
  }

  const pendingCount = files.filter((f) => f.status === 'pending' || f.status === 'uploading').length

  return (
    <Modal
      title={entry ? 'Edit Log Entry' : 'New Daily Log Entry'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-secondary" onClick={() => save('draft')} disabled={loading}>
            {loading ? <Spinner size={13} /> : 'Save Draft'}
          </button>
          <button
            className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
            onClick={() => save('submitted')}
            disabled={loading || !form.activities.trim()}
          >
            {!loading && 'Submit Entry'}
          </button>
        </>
      }
    >
      <div className="form-row">
        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            value={form.entry_date}
            onChange={(e) => set('entry_date', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Attendance</label>
          <select
            value={form.attendance_status}
            onChange={(e) => set('attendance_status', e.target.value)}
          >
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="half-day">Half Day</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Activities Performed *</label>
        <textarea
          value={form.activities}
          onChange={(e) => set('activities', e.target.value)}
          placeholder="Describe the technical work and activities you performed today..."
        />
      </div>

      <div className="form-group">
        <label>Skills Learned / Applied</label>
        <textarea
          value={form.skills_learned}
          onChange={(e) => set('skills_learned', e.target.value)}
          placeholder="e.g. Python scripting, database design, API integration..."
          style={{ minHeight: 70 }}
        />
      </div>

      <div className="form-group">
        <label>Challenges Encountered</label>
        <textarea
          value={form.challenges}
          onChange={(e) => set('challenges', e.target.value)}
          placeholder="What challenges did you face and how did you address them?"
          style={{ minHeight: 70 }}
        />
      </div>

      <div className="form-group">
        <label>Proof of Work (optional)</label>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />

        <div
          className={`upload-area ${dragOver ? 'dragover' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="upload-icon">📎</div>
          <p>Drag &amp; drop files or click to upload</p>
          <small>PDF, JPG, PNG up to {MAX_FILE_MB}MB</small>
        </div>

        {isMockMode && (
          <p className="form-hint">
            Demo mode — files are previewed locally, not uploaded to real storage.
          </p>
        )}

        {files.length > 0 && (
          <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
            {files.map((f) => (
              <div
                key={f.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', background: 'var(--surface2)',
                  border: '1px solid var(--border)', borderRadius: 8, fontSize: 12,
                }}
              >
                <span style={{ fontSize: 16 }}>
                  {f.file?.type === 'application/pdf' ? '📄' : '🖼️'}
                </span>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                    {f.name}
                  </div>
                  <div style={{ color: 'var(--text3)', fontSize: 11 }}>
                    {formatSize(f.size)}
                    {f.status === 'error' && <span style={{ color: 'var(--red)' }}> · {f.error}</span>}
                    {f.status === 'uploading' && <span> · Uploading…</span>}
                    {f.status === 'done' && <span style={{ color: 'var(--accent)' }}> · Uploaded</span>}
                  </div>
                </div>
                {f.status === 'uploading' ? (
                  <Spinner size={14} />
                ) : f.status === 'done' ? (
                  <span style={{ color: 'var(--accent)' }}>✓</span>
                ) : (
                  <button
                    className="btn-ghost btn-sm"
                    style={{ padding: '2px 6px' }}
                    onClick={(e) => { e.stopPropagation(); removeFile(f.id) }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {pendingCount > 0 && (
          <p className="form-hint">
            {pendingCount} file{pendingCount > 1 ? 's' : ''} will upload when you save.
          </p>
        )}
      </div>
    </Modal>
  )
}
