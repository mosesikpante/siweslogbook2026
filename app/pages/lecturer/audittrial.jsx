export default function AuditTrail() {
  const events = [
    { id: 1, action: "Log Entry Approved", user: "Mr. Emeka Nwosu", entity: "Entry #e3 — Chidi Okonkwo", time: "2024-06-07 09:14", icon: "✅" },
    { id: 2, action: "Weekly Report Signed", user: "Mr. Emeka Nwosu", entity: "Week 1 Report — Chidi Okonkwo", time: "2024-06-10 09:00", icon: "✍️" },
    { id: 3, action: "Log Entry Submitted", user: "Chidi Okonkwo", entity: "Entry #e2", time: "2024-06-04 17:30", icon: "📤" },
    { id: 4, action: "Account Created", user: "Chidi Okonkwo", entity: "Student Account", time: "2024-06-01 08:00", icon: "👤" },
    { id: 5, action: "AI Report Generated", user: "Chidi Okonkwo", entity: "Week 1 Report", time: "2024-06-08 11:22", icon: "🤖" },
  ];
  return (
    <div className="page animate-in">
      <div className="page-header"><h1>Audit Trail</h1><p>Complete log of all system actions and approvals</p></div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Timestamp</th><th>Action</th><th>User</th><th>Entity</th></tr></thead>
            <tbody>
              {events.map(e => (
                <tr key={e.id}>
                  <td className="font-mono text-sm">{e.time}</td>
                  <td><span style={{ fontSize: 13 }}>{e.icon} {e.action}</span></td>
                  <td style={{ fontSize: 13 }}>{e.user}</td>
                  <td style={{ fontSize: 12, color: "var(--text2)" }}>{e.entity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}