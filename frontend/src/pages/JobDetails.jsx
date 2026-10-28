
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  MapPin,
  Clock3,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import api, { getApiError } from "../lib/api";

export default function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api.get(`/jobs/${id}`)
      .then(({ data }) => setJob(data.job))
      .catch((requestError) => setError(getApiError(requestError)));
  }, [id]);

  if (error || !job) {
    return (
      <main className="job-not-found">
        <h1>Job not found</h1>
        <p>{error || "Loading opportunity..."}</p>
        <Link to="/jobs" className="primary-button">
          Back to jobs
        </Link>
      </main>
    );
  }

  return (
    <div className="jobs-page">
      <nav className="navbar">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <BriefcaseBusiness size={22} />
          </span>
          SmartHire
        </Link>

        <div className="nav-links">
          <Link to="/jobs">Browse jobs</Link>
          <Link to="/login">Log in</Link>
        </div>
      </nav>

      <main className="job-detail-container">
        <Link to="/jobs" className="back-to-jobs">
          <ArrowLeft size={17} /> Back to opportunities
        </Link>

        <section className="job-detail-card">
          <span className="job-type">{job.type}</span>
          <div className="job-company-icon detail-icon">
            <BriefcaseBusiness size={30} />
          </div>

          <h1>{job.title}</h1>
          <h3>{job.company}</h3>

          <div className="job-meta detail-meta">
            <span><MapPin size={17} /> {job.location}</span>
            <span><Clock3 size={17} /> {job.experience}</span>
          </div>

          <div className="job-detail-salary">
            <small>Compensation</small>
            <strong>{job.salary}</strong>
          </div>

          <hr />

          <h2>About this opportunity</h2>
          <p className="detail-description">{job.description}</p>

          <h2>Skills and qualifications</h2>
          <div className="job-skills detail-skills">
            {job.skills.map((skill) => (
              <span key={skill}>
                <CheckCircle2 size={14} /> {skill}
              </span>
            ))}
          </div>

          <Link to={`/apply/${job._id}`} className="primary-button apply-button">
  Apply now
</Link>
        </section>
      </main>
    </div>
  );
}
