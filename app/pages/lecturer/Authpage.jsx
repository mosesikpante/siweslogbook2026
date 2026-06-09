// ─── AUTH PAGE ───────────────────────────────────────────────
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { isMockMode, MOCK_STATE } from '../../data/mockdata'
import Alert from '../../components/alert'
 
export default
function AuthPage({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "student", matric_no: "", company_name: "", department: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async () => {
    setLoading(true); setError("");
    try {
      if (isMockMode) {
        const user = MOCK_STATE.users.find(u => u.email === form.email);
        if (!user) throw new Error("User not found in demo. Try the demo buttons below.");
        supabase._token = "mock_token";
        onLogin(user);
      } else {
        const { data, error: e } = await supabase.auth.signIn({ email: form.email, password: form.password });
        if (e) throw e;
        const { data: profile } = await supabase.from("profiles").select().eq("id", data.user.id);
        onLogin(profile?.[0]);
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleRegister = async () => {
    setLoading(true); setError("");
    try {
      if (isMockMode) {
        const newUser = { id: `u${Date.now()}`, ...form };
        MOCK_STATE.users.push(newUser);
        supabase._token = "mock_token";
        onLogin(newUser);
      } else {
        const { data, error: e } = await supabase.auth.signUp({ email: form.email, password: form.password, options: { data: { full_name: form.full_name } } });
        if (e) throw e;
        await supabase.from("profiles").insert({ id: data.user.id, ...form });
        onLogin({ id: data.user.id, ...form });
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const loginDemo = (email) => { setForm(f => ({ ...f, email, password: "demo123" })); };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-big">S</div>
          <h1>SIWES Digital Logbook</h1>
          <p>Student Industrial Work Experience Scheme</p>
        </div>
        {isMockMode && <div style={{ marginBottom: 16 }}><Alert type="warning">Demo Mode — Supabase not configured. Data is in-memory only.</Alert></div>}
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === "login" ? "active" : ""}`} onClick={() => setTab("login")}>Sign In</button>
          <button className={`auth-tab ${tab === "register" ? "active" : ""}`} onClick={() => setTab("register")}>Register</button>
        </div>
        {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
        {tab === "login" ? (
          <>
            <div className="form-group"><label>Email Address</label><input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@university.edu.ng" /></div>
            <div className="form-group"><label>Password</label><input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="••••••••" /></div>
            <button className={`btn btn-primary ${loading ? "btn-loading" : ""}`} style={{ width: "100%", justifyContent: "center" }} onClick={handleLogin} disabled={loading}>{!loading && "Sign In"}</button>
            <div className="demo-accounts">
              <p>Quick Demo Access</p>
              <div className="demo-btns">
                <button className="demo-btn" onClick={() => loginDemo("student@demo.com")}>👨‍🎓 Student</button>
                <button className="demo-btn" onClick={() => loginDemo("supervisor@demo.com")}>👔 Supervisor</button>
                <button className="demo-btn" onClick={() => loginDemo("lecturer@demo.com")}>🎓 Lecturer</button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="form-group"><label>Full Name</label><input value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="e.g. Chidi Okonkwo" /></div>
            <div className="form-row">
              <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => set("email", e.target.value)} /></div>
              <div className="form-group"><label>Password</label><input type="password" value={form.password} onChange={e => set("password", e.target.value)} /></div>
            </div>
            <div className="form-group"><label>Role</label>
              <select value={form.role} onChange={e => set("role", e.target.value)}>
                <option value="student">Student</option>
                <option value="supervisor">Industry Supervisor</option>
                <option value="lecturer">University Lecturer</option>
              </select>
            </div>
            {form.role === "student" && <>
              <div className="form-row">
                <div className="form-group"><label>Matric Number</label><input value={form.matric_no} onChange={e => set("matric_no", e.target.value)} /></div>
                <div className="form-group"><label>Department</label><input value={form.department} onChange={e => set("department", e.target.value)} /></div>
              </div>
              <div className="form-group"><label>Company / Organisation</label><input value={form.company_name} onChange={e => set("company_name", e.target.value)} /></div>
            </>}
            {form.role === "supervisor" && <div className="form-group"><label>Company Name</label><input value={form.company_name} onChange={e => set("company_name", e.target.value)} /></div>}
            {form.role === "lecturer" && <div className="form-group"><label>Department</label><input value={form.department} onChange={e => set("department", e.target.value)} /></div>}
            <button className={`btn btn-primary ${loading ? "btn-loading" : ""}`} style={{ width: "100%", justifyContent: "center" }} onClick={handleRegister} disabled={loading}>{!loading && "Create Account"}</button>
          </>
        )}
      </div>
    </div>
  );
}

