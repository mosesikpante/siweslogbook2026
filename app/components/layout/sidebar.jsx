import { initials } from '../../utils/helpers'
import { supabase } from '../../lib/supabase'

const NAV_ITEMS = {
  student: [
    { id: 'home',    label: 'Dashboard',      icon: '🏠' },
    { id: 'logs',    label: 'Daily Logs',      icon: '📝' },
    { id: 'reports', label: 'Weekly Reports',  icon: '📊' },
    { id: 'profile', label: 'Profile',         icon: '👤' },
  ],
  supervisor: [
    { id: 'home',     label: 'Dashboard',       icon: '🏠' },
    { id: 'review',   label: 'Review & Approve', icon: '✅' },
    { id: 'students', label: 'My Students',      icon: '👨‍🎓' },
    { id: 'profile',  label: 'Profile',          icon: '👤' },
  ],
  lecturer: [
    { id: 'home',     label: 'Dashboard',         icon: '🏠' },
    { id: 'students', label: 'Monitor Students',  icon: '👨‍🎓' },
    { id: 'reports',  label: 'View Reports',       icon: '📊' },
    { id: 'audit',    label: 'Audit Trail',        icon: '🔍' },
    { id: 'profile',  label: 'Profile',            icon: '👤' },
  ],
}

export default function Sidebar({ user, activeTab, onTabChange, onLogout }) {
  const items = NAV_ITEMS[user.role] || []

  const handleLogout = () => {
    supabase.auth.signOut()
    onLogout()
  }

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">S</div>
        <div>
          <span>SIWES Logbook</span>
          <small>Digital Platform</small>
        </div>
      </div>

      <div className="sidebar-section">Navigation</div>

      {items.map((item) => (
        <div
          key={item.id}
          className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
          onClick={() => onTabChange(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          {item.label}
        </div>
      ))}

      <div className="sidebar-footer">
        <div className="user-chip">
          <div className={`avatar ${user.role}`}>{initials(user.full_name)}</div>
          <div className="user-chip-info">
            <div className="user-chip-name">{user.full_name}</div>
            <div className="user-chip-role">{user.role}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Sign out">⏻</button>
        </div>
      </div>
    </nav>
  )
}