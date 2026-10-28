
import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BriefcaseBusiness,
  MapPin,
  Search,
  ArrowRight,
  Clock3,
} from "lucide-react";
import api, { getApiError } from "../lib/api";

export default function Jobs() {
  const [search, setSearch] = useState("");
  const [jobType, setJobType] = useState("All");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/jobs")
      .then(({ data }) => setJobs(data.jobs))
      .catch((requestError) => setError(getApiError(requestError)))
      .finally(() => setLoading(false));
  }, []);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query) ||
        job.skills.some((skill) => skill.toLowerCase().includes(query));

      const matchesType =
        jobType === "All" || job.type === jobType;

      return matchesSearch && matchesType;
    });
  }, [jobs, search, jobType]);

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
          <Link to="/">Home</Link>
          <Link to="/dashboard?role=student">Dashboard</Link>
          <Link to="/login">Log in</Link>
        </div>
      </nav>

      <header className="jobs-hero">
        <span className="section-label">YOUR NEXT OPPORTUNITY</span>
        <h1>Find a job that fits your future.</h1>
        <p>Explore opportunities and discover your next career move.</p>

        <div className="jobs-search">
          <Search size={21} />
          <input
            type="search"
            placeholder="Search job title, company, location or skill..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </header>

      <main className="jobs-container">
        <div className="jobs-toolbar">
          <div>
            <h2>Explore opportunities</h2>
            <p>{filteredJobs.length} published jobs found</p>
          </div>

          <select
            aria-label="Filter by job type"
            value={jobType}
            onChange={(event) => setJobType(event.target.value)}
          >
            <option value="All">All job types</option>
            <option value="Internship">Internship</option>
            <option value="Full-time">Full-time</option>
          </select>
        </div>

        {loading ? <div className="jobs-empty"><p>Loading opportunities...</p></div> : error ? (
          <div className="jobs-empty"><h3>Unable to load jobs</h3><p>{error}</p></div>
        ) : filteredJobs.length > 0 ? (
          <div className="jobs-grid">
            {filteredJobs.map((job) => (
              <article className="job-card" key={job._id}>
                <div className="job-card-top">
                  <div className="job-company-icon">
                    <BriefcaseBusiness size={24} />
                  </div>
                  <span className="job-type">{job.type}</span>
                </div>

                <h3>{job.title}</h3>
                <p className="job-company">{job.company}</p>

                <div className="job-meta">
                  <span><MapPin size={15} /> {job.location}</span>
                  <span><Clock3 size={15} /> {job.experience}</span>
                </div>

                <p className="job-description">{job.description}</p>

                <div className="job-skills">
                  {job.skills.slice(0, 3).map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>

                <div className="job-card-bottom">
                  <div>
                    <small>Compensation</small>
                    <strong>{job.salary}</strong>
                  </div>

                  <Link to={`/jobs/${job._id}`} className="job-details-link">
                    Details <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="jobs-empty">
            <Search size={30} />
            <h3>No matching jobs found</h3>
            <p>Try another keyword or change the job type filter.</p>
            <button
              className="primary-button"
              onClick={() => {
                setSearch("");
                setJobType("All");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
