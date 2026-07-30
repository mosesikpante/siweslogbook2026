import { supabase } from './supabase.jsx'

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabase._token}`,
    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
  }
}

// Existing function — weekly report
export async function generateWeeklyReport(entries, studentName, companyName) {
  const res = await fetch(EDGE_URL, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ type: 'weekly-report', entries, studentName, companyName }),
  })
  const data = await res.json()
  if (!res.ok || data.error) throw new Error(data.error || 'Failed to generate report')
  return data.summary
}

// New function — AI supervisor comment
export async function generateSupervisorComment(entry, supervisorName, companyName, action) {
  const res = await fetch(EDGE_URL, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      type: 'supervisor-comment',
      entry,
      supervisorName,
      companyName,
      action, // 'approved' or 'rejected'
    }),
  })
  const data = await res.json()
  if (!res.ok || data.error) throw new Error(data.error || 'Failed to generate comment')
  return data.comment
}