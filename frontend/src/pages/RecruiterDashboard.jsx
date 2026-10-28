import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BriefcaseBusiness, Users, Plus, Pencil, Archive, CheckCircle } from "lucide-react";
import api, { getApiError } from "../lib/api";

const initialForm = { title: "", company: "", location: "", type: "Full-time", category: "", salary: "", experience: "", description: "", skills: "" };

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadJobs() {
    try { setJobs((await api.get("/recruiter/jobs")).data.jobs); } catch (requestError) { setError(getApiError(requestError)); }
  }
  useEffect(() => { // oxlint-disable-next-line react-hooks/set-state-in-effect
    loadJobs();
  }, []);

  function updateField(event) { setForm({ ...form, [event.target.name]: event.target.value }); }
  async function saveJob(event) {
    event.preventDefault();
    setError(""); setMessage("");
    try {
      const payload = { ...form, skills: form.skills.split(",").map((skill) => skill.trim()).filter(Boolean) };
      if (editing) await api.patch(`/jobs/${editing}`, payload);
      else await api.post("/jobs", payload);
      setForm(initialForm); setEditing(null); setMessage("Job saved as a draft."); await loadJobs();
    } catch (requestError) { setError(getApiError(requestError)); }
  }
  async function setStatus(id, status) {
    try { await api.patch(`/jobs/${id}`, { status }); await loadJobs(); }
    catch (requestError) { setError(getApiError(requestError)); }
  }
  function startEdit(job) {
    setEditing(job._id);
    setForm({ ...job, skills: job.skills.join(", ") });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return <div className="dashboard-layout">
    <aside className="dashboard-sidebar">
      <Link to="/" className="brand"><span className="brand-icon"><BriefcaseBusiness size={22} /></span>SmartHire</Link>
      <p className="sidebar-label">RECRUITER WORKSPACE</p>
      <Link to="/recruiter" className="sidebar-item active"><BriefcaseBusiness size={19} /> Jobs</Link>
      <Link to="/recruiter/applicants" className="sidebar-item"><Users size={19} /> Applicants</Link>
      <Link to="/profile" className="sidebar-item">My Profile</Link>
      <Link to="/dashboard" className="sidebar-item">Overview</Link>
    </aside>
    <main className="dashboard-main">
      <span className="section-label">RECRUITER PORTAL</span><h1>Manage your hiring pipeline</h1>
      {error && <p className="application-error">{error}</p>}{message && <p className="success-message">{message}</p>}
      <section className="dashboard-panel">
        <h2>{editing ? "Edit job" : "Post a new job"}</h2>
        <form className="application-form" onSubmit={saveJob}>
          {["title", "company", "location", "category", "salary", "experience"].map((field) => <label key={field}>{field[0].toUpperCase() + field.slice(1)}<input name={field} value={form[field]} onChange={updateField} required={["title", "company", "location"].includes(field)} /></label>)}
          <label>Job type<select name="type" value={form.type} onChange={updateField}><option>Full-time</option><option>Internship</option><option>Part-time</option><option>Contract</option></select></label>
          <label>Skills (comma separated)<input name="skills" value={form.skills} onChange={updateField} /></label>
          <label>Description<textarea name="description" rows={5} value={form.description} onChange={updateField} required /></label>
          <button className="primary-button" type="submit"><Plus size={17} /> {editing ? "Save changes" : "Create draft"}</button>
        </form>
      </section>
      <section className="dashboard-panel">
        <h2>Your jobs</h2>
        {jobs.length === 0 ? <p>No jobs yet. Create your first draft above.</p> : jobs.map((job) => <article className="dashboard-action" key={job._id}>
          <div><strong>{job.title}</strong><p>{job.company} · {job.status} · {job.applicantCount} applicants</p></div>
          <button className="secondary-button" onClick={() => startEdit(job)}><Pencil size={15} /> Edit</button>
          {job.status === "draft" && <button className="primary-button" onClick={() => setStatus(job._id, "published")}><CheckCircle size={15} /> Publish</button>}
          {job.status === "published" && <button className="secondary-button" onClick={() => setStatus(job._id, "closed")}>Close</button>}
          {job.status !== "archived" && <button className="secondary-button" onClick={() => setStatus(job._id, "archived")}><Archive size={15} /></button>}
        </article>)}
      </section>
    </main>
  </div>;
}
