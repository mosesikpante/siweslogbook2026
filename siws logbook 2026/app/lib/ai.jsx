import { supabase } from './supabase.jsx'

// Calls our Supabase Edge Function proxy instead of Anthropic directly.
// Direct browser → Anthropic calls are blocked by CORS.
export async function generateWeeklyReport(entries, studentName, companyName) {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabase._token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        dailyLogs: entries,
        studentName,
        companyName,
      }),
    }
  )

  const data = await response.json()
  const summary = typeof data.summary === 'string' ? data.summary.trim() : ''

  if (!response.ok || data.error || !summary || /failed to parse/i.test(summary)) {
    throw new Error(data.error || 'AI generated an empty report summary. Please try again.')
  }

  return summary
}