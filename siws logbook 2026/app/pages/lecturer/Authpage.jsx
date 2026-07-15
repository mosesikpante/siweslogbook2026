// ─── AUTH PAGE ───────────────────────────────────────────────
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { isMockMode, MOCK_STATE } from "../../data/mockdata.jsx";
import Alert from "../../components/alert.jsx";


// ─── Human-readable translation for raw Supabase/Postgres error text ──
function translateAuthError(message = '') {
  if (message.includes('Email not confirmed')) {
    return 'Your account is registered but email verification is pending. Please check your inbox, or delete this test user from your Supabase dashboard to register fresh.'
  }
  if (message.includes('Invalid login credentials')) {
    return 'Incorrect email or password. Please verify your entries.'
  }
  if (message.includes('User already registered') || message.includes('already registered')) {
    return 'This email is already registered. Switch to "Sign In" instead.'
  }
  if (message.includes('Password should be at least')) {
    return message // Supabase's own text here is already clear
  }
  return message || 'An unexpected error occurred. Please try again.'
}

export default function AuthPage({ onLogin }) {
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'student',
    matric_no: '',
    company_name: '',
    department: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // ── SIGN IN ──────────────────────────────────────────────
  // Single responsibility: authenticate, then fetch the matching profile.
  // Relies on supabase.auth.signIn() always resolving to { data, error } —
  // it never throws, so no try/catch is needed for the auth call itself.
  const handleLogin = async () => {
    setLoading(true)
    setError('')

    if (!form.email || !form.password) {
      setError('Please enter both email and password.')
      setLoading(false)
      return
    }

    if (isMockMode) {
      const user = MOCK_STATE.users.find((u) => u.email === form.email)
      if (!user) {
        setError('User not found in demo. Try the demo buttons below.')
        setLoading(false)
        return
      }
      supabase._token = 'mock_token'
      onLogin(user)
      setLoading(false)
      return
    }

    // Real Supabase flow
    const { data: authData, error: authError } = await supabase.auth.signIn({
      email: form.email,
      password: form.password,
    })

    if (authError) {
      setError(translateAuthError(authError.message))
      setLoading(false)
      return
    }

    const userId = authData?.user?.id
    if (!userId) {
      setError('Authentication succeeded, but user identity is missing. Please try again.')
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select()
      .eq('id', userId)

    if (profileError) {
      setError(translateAuthError(profileError.message))
      setLoading(false)
      return
    }

    if (!profile || profile.length === 0) {
      setError('Your account was authenticated, but no matching profile record was found.')
      setLoading(false)
      return
    }

    onLogin(profile[0])
    setLoading(false)
  }

  // ── REGISTER ─────────────────────────────────────────────
  const handleRegister = async () => {
    setLoading(true)
    setError('')

    if (!form.full_name || !form.email || !form.password) {
      setError('Please fill in your name, email, and password.')
      setLoading(false)
      return
    }

    if (isMockMode) {
      const newUser = { id: `u${Date.now()}`, ...form }
      MOCK_STATE.users.push(newUser)
      supabase._token = 'mock_token'
      onLogin(newUser)
      setLoading(false)
      return
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name } },
    })

    if (signUpError) {
      setError(translateAuthError(signUpError.message))
      setLoading(false)
      return
    }

    const newUserId = signUpData?.user?.id
    if (!newUserId) {
      setError('Registration completed, but no user data was returned. Please try signing in.')
      setLoading(false)
      return
    }

    // Build only the fields relevant to the chosen role
    const profilePayload = {
      id: newUserId,
      full_name: form.full_name,
      email: form.email,
      role: form.role,
      ...(form.role === 'student' && {
        matric_no: form.matric_no,
        department: form.department,
        company_name: form.company_name,
      }),
      ...(form.role === 'supervisor' && { company_name: form.company_name }),
      ...(form.role === 'lecturer' && { department: form.department }),
    }

    const { error: insertError } = await supabase.from('profiles').insert(profilePayload)

    if (insertError) {
      setError(translateAuthError(insertError.message))
      setLoading(false)
      return
    }

    onLogin(profilePayload)
    setLoading(false)
  }

  // ── DEMO QUICK-LOGIN ─────────────────────────────────────
  // Pre-fills the form so the user just clicks "Sign In".
  const loginDemo = (email) => {
    setForm((f) => ({ ...f, email, password: 'demo123' }))
    setError('')
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-big">S</div>
          <h1>SIWES Digital Logbook</h1>
          <p>Student Industrial Work Experience Scheme</p>
        </div>

        {isMockMode && (
          <div style={{ marginBottom: 16 }}>
            <Alert type="warning">
              Demo Mode — Supabase not configured. Data is in-memory only.
            </Alert>
          </div>
        )}

        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError('') }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError('') }}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {tab === 'login' ? (
          <>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="you@university.edu.ng"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button
              className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleLogin}
              disabled={loading}
            >
              {!loading && 'Sign In'}
            </button>

            <div className="demo-accounts">
              <p>Quick Demo Access</p>
              <div className="demo-btns">
                <button className="demo-btn" onClick={() => loginDemo('student@demo.com')}>👨‍🎓 Student</button>
                <button className="demo-btn" onClick={() => loginDemo('supervisor@demo.com')}>👔 Supervisor</button>
                <button className="demo-btn" onClick={() => loginDemo('lecturer@demo.com')}>🎓 Lecturer</button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="form-group">
              <label>Full Name</label>
              <input
                value={form.full_name}
                onChange={(e) => set('full_name', e.target.value)}
                placeholder="e.g. Chidi Okonkwo"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={form.role} onChange={(e) => set('role', e.target.value)}>
                <option value="student">Student</option>
                <option value="supervisor">Industry Supervisor</option>
                <option value="lecturer">University Lecturer</option>
              </select>
            </div>

            {form.role === 'student' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Matric Number</label>
                    <input value={form.matric_no} onChange={(e) => set('matric_no', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <input value={form.department} onChange={(e) => set('department', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Company / Organisation</label>
                  <input value={form.company_name} onChange={(e) => set('company_name', e.target.value)} />
                </div>
              </>
            )}
            {form.role === 'supervisor' && (
              <div className="form-group">
                <label>Company Name</label>
                <input value={form.company_name} onChange={(e) => set('company_name', e.target.value)} />
              </div>
            )}
            {form.role === 'lecturer' && (
              <div className="form-group">
                <label>Department</label>
                <input value={form.department} onChange={(e) => set('department', e.target.value)} />
              </div>
            )}

            <button
              className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleRegister}
              disabled={loading}
            >
              {!loading && 'Create Account'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
