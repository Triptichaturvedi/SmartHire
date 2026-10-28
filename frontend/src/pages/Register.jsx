
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/useAuth.js";

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { register, getApiError } = useAuth();

  const [role, setRole] = useState(
    searchParams.get("role") || "student"
  );
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register({ ...form, role });
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="brand">
          SmartHire
        </Link>

        <h1>Create your account</h1>
        <p>Choose your portal and start your career journey.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="role">Register as</label>
          <select
            id="role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            required
          >
            <option value="student">Student / Fresher</option>
            <option value="professional">Experienced Professional</option>
            <option value="recruiter">Recruiter</option>
          </select>

          <label htmlFor="name">Full name</label>
          <input
            id="name"
            type="text"
            placeholder="Enter your full name"
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />

          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            required
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Create a password"
            minLength={8}
            required
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />

          {error && <p className="application-error">{error}</p>}
          <button type="submit" className="primary-button full-width">
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          Already registered? <Link to="/login">Log in</Link>
        </p>

        <Link to="/" className="back-link">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
