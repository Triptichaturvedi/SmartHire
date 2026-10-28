
import { Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { BriefcaseBusiness, ArrowLeft } from "lucide-react";
import api, { getApiError } from "../lib/api";

export default function ApplyJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get(`/jobs/${id}`)
      .then(({ data }) => setJob(data.job))
      .catch(() => setJob(null))
      .finally(() => setLoading(false));
  }, [id]);

  const [form, setForm] = useState({
    phone: "",
    coverLetter: "",
  });

  const [error, setError] = useState("");

  if (loading) return <div className="page-state">Loading job...</div>;
  if (!job) {
    return (
      <div className="application-page">
        <h1>Job not found</h1>
        <Link to="/jobs">Back to jobs</Link>
      </div>
    );
  }

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await api.post(`/jobs/${job._id}/applications`, form);
      navigate("/applications");
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  }

  return (
    <div className="application-page">
      <nav className="navbar">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <BriefcaseBusiness size={22} />
          </span>
          SmartHire
        </Link>
        <div className="nav-links">
          <Link to="/jobs">Browse Jobs</Link>
          <Link to="/applications">My Applications</Link>
        </div>
      </nav>

      <main className="application-container">
        <Link to={`/jobs/${job._id}`} className="back-to-jobs">
          <ArrowLeft size={17} /> Back to job details
        </Link>

        <section className="application-card">
          <span className="section-label">YOUR NEXT CAREER STEP</span>
          <h1>Apply for this job</h1>
          <div className="application-job-summary">
            <h2>{job.title}</h2>
            <p>{job.company} · {job.location}</p>
            <span>{job.type}</span>
          </div>

          <form onSubmit={handleSubmit} className="application-form">
            <label htmlFor="app-phone">Phone number</label>
            <input
              id="app-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              autoComplete="tel"
              required
            />

            <label htmlFor="app-cover">Why are you a good fit?</label>
            <textarea
              id="app-cover"
              name="coverLetter"
              value={form.coverLetter}
              onChange={handleChange}
              placeholder="Briefly describe your skills and interest in this role..."
              rows={5}
              required
            />

            {error && <p className="application-error">{error}</p>}

            <button type="submit" className="primary-button full-width">
              Submit application
            </button>
          </form>

          <p className="application-disclaimer">
            Your application is securely submitted to SmartHire and stored with this account.
          </p>
        </section>
      </main>
    </div>
  );
}
