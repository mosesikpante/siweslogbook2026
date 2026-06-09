function ProfilePage({ user }) {
  return (
    <div className="page animate-in">
      <div className="page-header"><h1>My Profile</h1></div>
      <div className="card" style={{ maxWidth: 600 }}>
        <div className="card-body">
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, padding: "16px", background: "var(--surface2)", borderRadius: 10 }}>
            <div className={`avatar ${user.role}`} style={{ width: 56, height: 56, fontSize: 20 }}>{initials(user.full_name)}</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{user.full_name}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}><span className={`badge ${user.role}`}>{user.role}</span><span style={{ fontSize: 12, color: "var(--text2)" }}>{user.email}</span></div>
            </div>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {[["Email", user.email], ["Role", user.role], user.matric_no && ["Matric Number", user.matric_no], user.company_name && ["Company / Organisation", user.company_name], user.department && ["Department", user.department], user.siwes_start_date && ["SIWES Start Date", fmt(user.siwes_start_date)], user.siwes_end_date && ["SIWES End Date", fmt(user.siwes_end_date)]].filter(Boolean).map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 13, color: "var(--text2)" }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 500, textTransform: k === "Role" ? "capitalize" : "none" }}>{v || "—"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}