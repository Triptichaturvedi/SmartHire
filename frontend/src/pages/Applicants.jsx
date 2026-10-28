import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getApiError } from "../lib/api";

export default function Applicants() {
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState("");
  async function load() { try { setApplications((await api.get("/applications/recruiter")).data.applications); } catch (e) { setError(getApiError(e)); } }
  useEffect(() => { // oxlint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);
  async function update(id, status, note) {
    try { await api.patch(`/applications/${id}/status`, { status, note }); await load(); }
    catch (e) { setError(getApiError(e)); }
  }
  return <div className="application-page"><nav className="navbar"><Link to="/" className="brand">SmartHire</Link><div className="nav-links"><Link to="/recruiter">Manage jobs</Link><Link to="/dashboard">Dashboard</Link></div></nav><main className="applications-container"><span className="section-label">APPLICANT TRACKING SYSTEM</span><h1>Applicants</h1>{error && <p className="application-error">{error}</p>}{applications.length === 0 ? <section className="applications-empty"><h2>No applicants yet</h2><p>Applicants for your published jobs will appear here.</p></section> : applications.map((application) => <article className="application-list-card" key={application._id}><div className="application-list-info"><h2>{application.candidate.name}</h2><p>{application.job.title} · {application.candidate.email}</p><p>{application.candidate.profile?.headline || "No headline provided"}</p><p className="application-candidate">{application.coverLetter}</p><textarea aria-label="Recruiter note" defaultValue={application.recruiterNotes || ""} placeholder="Recruiter note" rows={2} id={`note-${application._id}`} /><div className="nav-links"><select value={application.status} onChange={(event) => update(application._id, event.target.value, document.getElementById(`note-${application._id}`).value)}><option value="submitted">Submitted</option><option value="shortlisted">Shortlisted</option><option value="interview">Interview</option><option value="offered">Hired / Offered</option><option value="rejected">Rejected</option></select>{application.candidate.profile?.resume && <button className="secondary-button" onClick={() => api.get(`/applications/${application._id}/resume`, { responseType: "blob" }).then(({ data }) => { const url = URL.createObjectURL(data); const link = document.createElement("a"); link.href = url; link.download = application.candidate.profile.resume.originalName; link.click(); URL.revokeObjectURL(url); })}>Download resume</button>}</div></div><span className="application-status">{application.status}</span></article>)}</main></div>;
}
