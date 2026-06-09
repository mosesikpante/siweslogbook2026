// ─── MAIN APP ────────────────────────────────────────────────

import React, { useState } from 'react';

// 1. Framework Imports / Layouts
import AuthPage from './pages/AuthPage';
import StudentDashboard from './pages/student/StudentDashboard';
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard';
import LecturerDashboard from './pages/lecturer/LecturerDashboard';

// 2. Data & Configuration Imports
import { isMockMode } from './data/mockData';
import { supabase } from './lib/supabase';
import { initials } from './utils/helpers';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("home");

  const navItems = {
    student: [
      { id: "home", label: "Dashboard", icon: "🏠" },
      { id: "logs", label: "Daily Logs", icon: "📝" },
      { id: "reports", label: "Weekly Reports", icon: "📊" },
      { id: "profile", label: "Profile", icon: "👤" },
    ],
    supervisor: [
      { id: "home", label: "Dashboard", icon: "🏠" },
      { id: "review", label: "Review & Approve", icon: "✅" },
      { id: "students", label: "My Students", icon: "👨‍🎓" },
      { id: "profile", label: "Profile", icon: "👤" },
    ],
    lecturer: [
      { id: "home", label: "Dashboard", icon: "🏠" },
      { id: "students", label: "Monitor Students", icon: "👨‍🎓" },
      { id: "reports", label: "View Reports", icon: "📊" },
      { id: "audit", label: "Audit Trail", icon: "🔍" },
      { id: "profile", label: "Profile", icon: "👤" },
    ],
  };

  const handleLogin = (u) => { 
    setUser(u); 
    setActiveTab("home"); 
  };

  const handleLogout = () => { 
    supabase.auth.signOut(); 
    setUser(null); 
  };

  if (!user) return (
    <AuthPage onLogin={handleLogin} />
  );

  const items = navItems[user.role] || [];

  return (
    <>
      {isMockMode && (
        <div className="mock-banner">
          ⚠️ Demo Mode — Replace SUPABASE_URL and SUPABASE_ANON_KEY to connect to your real database.
        </div>
      )}
      <div className="app">
        <nav className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">S</div>
            <div>
              <span>SIWES Logbook</span>
              <small>Digital Platform</small>
            </div>
          </div>
          
          <div className="sidebar-section">Navigation</div>
          
          {items.map(item => (
            <div 
              key={item.id} 
              className={`nav-item ${activeTab === item.id ? "active" : ""}`} 
              onClick={() => setActiveTab(item.id)}
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

        <main className="main">
          {user.role === "student" && <StudentDashboard user={user} activeTab={activeTab} />}
          {user.role === "supervisor" && <SupervisorDashboard user={user} activeTab={activeTab} />}
          {user.role === "lecturer" && <LecturerDashboard user={user} activeTab={activeTab} />}
        </main>
      </div>
    </>
  );
}