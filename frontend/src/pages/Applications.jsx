
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { BriefcaseBusiness, FileText, ArrowRight } from "lucide-react";
import api, { getApiError } from "../lib/api";

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/applications/mine")
      .then(({ data }) => setApplications(data.applications))
      .catch((requestError) => setError(getApiError(requestError)))
      .finally(() => setLoading(false));
  }, []);

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
          <Link to="/dashboard?role=student">Dashboard</Link>
        </div>
      </nav>

      <main className="applications-container">
        <span className="section-label">YOUR CAREER JOURNEY</span>
        <h1>My Applications</h1>
        <p className="applications-intro">
          Keep track of the jobs you have applied for.
        </p>

        {loading ? <div className="applications-empty"><p>Loading applications...</p></div> : error ? (
          <div className="applications-empty"><h2>Unable to load applications</h2><p>{error}</p></div>
        ) : applications.length === 0 ? (
          <section className="applications-empty">
            <FileText size={42} />
            <h2>No applications yet</h2>
            <p>Your submitted demo applications will appear here.</p>
            <Link to="/jobs" className="primary-button">
              Explore jobs <ArrowRight size={17} />
            </Link>
          </section>
        ) : (
          <>
            <p className="applications-count">
              {applications.length} application
              {applications.length === 1 ? "" : "s"} saved in this browser
            </p>

            <div className="applications-list">
              {applications.map((application, index) => (
                <article
                  className="application-list-card"
                  key={application._id || index}
                >
                  <div className="job-company-icon">
                    <BriefcaseBusiness size={24} />
                  </div>

                  <div className="application-list-info">
                    <h2>{application.job?.title}</h2>
                    <p>{application.job?.company} · {application.job?.location}</p>
                    <span>
                      Applied on{" "}
                      {new Date(application.createdAt).toLocaleDateString()}
                    </span>
                    <p className="application-candidate">
                      Status: {application.status}
                    </p>
                  </div>

                  <span className="application-status">
                    {application.status}
                  </span>
                </article>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
