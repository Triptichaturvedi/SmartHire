
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import { useEffect, useState } from "react";
import api, { getApiError } from "../lib/api";
import {
  BriefcaseBusiness,
  GraduationCap,
  UserRound,
  Building2,
  FileText,
  Bell,
  Search,
  ArrowUpRight,
  Settings,
  LogOut,
} from "lucide-react";

const dashboardData = {
  student: {
    title: "Student Dashboard",
    subtitle: "Your career journey starts here.",
    icon: GraduationCap,
    stats: [
      ["Recommended Jobs", "12", BriefcaseBusiness],
      ["Applications Sent", "0", FileText],
      ["Profile Completion", "40%", UserRound],
    ],
    actions: ["Explore internships", "Build your resume", "Track applications"],
  },
  professional: {
    title: "Professional Dashboard",
    subtitle: "Take the next step in your career.",
    icon: UserRound,
    stats: [
      ["Recommended Jobs", "18", BriefcaseBusiness],
      ["Applications Sent", "0", FileText],
      ["Profile Completion", "60%", UserRound],
    ],
    actions: ["Explore opportunities", "Update experience", "Track applications"],
  },
  recruiter: {
    title: "Recruiter Dashboard",
    subtitle: "Find the right people for your team.",
    icon: Building2,
    stats: [
      ["Active Job Posts", "0", BriefcaseBusiness],
      ["Total Applicants", "0", UserRound],
      ["Shortlisted", "0", FileText],
    ],
    actions: ["Post a new job", "Manage candidates", "Review applications"],
  },
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || "student";
  const data = dashboardData[role] || dashboardData.student;
  const RoleIcon = data.icon;
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api.get("/dashboard/stats").then(({ data: response }) => setStats(response.stats)).catch((requestError) => setError(getApiError(requestError)));
  }, []);
  const actualStats = role === "recruiter"
    ? [["Active Job Posts", stats?.activeJobs ?? "—", BriefcaseBusiness], ["Total Applicants", stats?.totalApplicants ?? "—", UserRound], ["Shortlisted", stats?.shortlisted ?? "—", FileText]]
    : [["Recommended Jobs", stats?.recommendedJobs ?? "—", BriefcaseBusiness], ["Applications Sent", stats?.applicationsSent ?? "—", FileText], ["Profile Completion", stats ? `${stats.profileCompletion}%` : "—", UserRound]];

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <BriefcaseBusiness size={22} />
          </span>
          SmartHire
        </Link>

        <p className="sidebar-label">WORKSPACE</p>
        <div className="sidebar-item active">
          <RoleIcon size={19} /> Dashboard
        </div>
        <Link to={role === "recruiter" ? "/recruiter" : "/jobs"} className="sidebar-item">
          <BriefcaseBusiness size={19} /> Opportunities
        </Link>
        <Link to={role === "recruiter" ? "/recruiter/applicants" : "/applications"} className="sidebar-item">
          <FileText size={19} /> Applications
        </Link>
        <Link to="/profile" className="sidebar-item">
          <UserRound size={19} /> My Profile
        </Link>

        <div className="sidebar-bottom">
          <div className="sidebar-item">
            <Settings size={19} /> Settings
          </div>
          <button className="sidebar-item" onClick={async () => { await logout(); navigate("/"); }}>
            <LogOut size={19} /> Log out
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="section-label">MY WORKSPACE</span>
            <p>Welcome to SmartHire</p>
          </div>
          <Link to="/notifications" className="notification-button" aria-label="Notifications"><Bell size={20} /></Link>
        </header>

        <section className="dashboard-welcome">
          <div>
            <span className="dashboard-role">
              <RoleIcon size={16} /> {role.replace("-", " ").toUpperCase()}
            </span>
            <h1>{data.title}</h1>
            <p>{data.subtitle}</p>
          </div>
          <div className="welcome-icon">
            <RoleIcon size={42} />
          </div>
        </section>

        <section className="dashboard-stats">
          {actualStats.map(([label, value, Icon]) => (
            <article className="dashboard-stat" key={label}>
              <div className="dashboard-stat-icon">
                <Icon size={22} />
              </div>
              <p>{label}</p>
              <h2>{value}</h2>
            </article>
          ))}
        </section>
        {error && <p className="application-error">{error}</p>}

        <section className="dashboard-content">
          <div className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <h2>Quick actions</h2>
                <p>Pick up where you want to begin.</p>
              </div>
              <ArrowUpRight size={21} />
            </div>

            {data.actions.map((action, index) => (
              <div className="dashboard-action" key={action}>
                <span className="action-number">0{index + 1}</span>
                <strong>{action}</strong>
                <ArrowUpRight size={18} />
              </div>
            ))}
          </div>

          <div className="dashboard-panel search-panel">
            <div className="dashboard-stat-icon">
              <Search size={23} />
            </div>
            <h2>
              {role === "recruiter"
                ? "Build your hiring pipeline"
                : "Your next opportunity awaits"}
            </h2>
            <p>
              {role === "recruiter"
                ? "Prepare to publish openings and connect with candidates."
                : "Complete your profile to get a more relevant career experience."}
            </p>
            <Link to={role === "recruiter" ? "/recruiter" : "/jobs"} className="dashboard-link">
              Explore SmartHire <ArrowUpRight size={17} />
            </Link>
          </div>
        </section>

        <p className="dashboard-note">
          Welcome, {user?.name}. Dashboard metrics will update as you use SmartHire.
        </p>
      </main>
    </div>
  );
}
