// ─── AI HELPER ──────────────────────────────────────────────
import { CLAUDE_MODEL } from '../config'
 
async function generateWeeklyReport(entries, studentName, companyName) {
  const prompt = `You are a professional SIWES (Student Industrial Work Experience Scheme) report writer. 
Generate a formal, corporate-style weekly summary report based on the following daily log entries.

Student: ${studentName}
Company: ${companyName}
Daily Entries:
${entries.map((e, i) => `Day ${i + 1} (${e.entry_date}): ${e.activities}. Skills: ${e.skills_learned || "N/A"}. Challenges: ${e.challenges || "None"}`).join("\n")}

Write a 3-4 paragraph professional weekly summary that:
1. Summarizes the key technical work accomplished
2. Highlights skills acquired and applied
3. Discusses challenges encountered and how they were addressed
4. Concludes with learning outcomes and value gained

Use formal, professional language appropriate for an academic/industrial report. Address the student in third person.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "Unable to generate report.";
}
