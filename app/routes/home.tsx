import { useState } from "react";
import type { Route } from "./+types/home";
// @ts-ignore
import AuthPage from "../pages/lecturer/Authpage";
// @ts-ignore
import Sidebar from "../components/layout/sidebar";
// @ts-ignore
import StudentDashboard from "../pages/student/studentdashboard";
// @ts-ignore
import SupervisorDashboard from "../pages/supervisor/supervisordashboard";
// @ts-ignore
import LecturerDashboard from "../pages/lecturer/lecturedashboard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "SIWES Logbook App" },
    { name: "description", content: "Digital SIWES Logbook Platform" },
  ];
}

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("home");

  const handleLogin = (u: any) => {
    setUser(u);
    setActiveTab("home");
  };

  const handleLogout = () => setUser(null);

  if (!user) return <AuthPage onLogin={handleLogin} />;

  return (
    <div className="app">
      <Sidebar
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />
      <main className="main">
        {user.role === "student" && (
          <StudentDashboard user={user} activeTab={activeTab} />
        )}
        {user.role === "supervisor" && (
          <SupervisorDashboard user={user} activeTab={activeTab} />
        )}
        {user.role === "lecturer" && (
          <LecturerDashboard user={user} activeTab={activeTab} />
        )}
      </main>
    </div>
  );
}
