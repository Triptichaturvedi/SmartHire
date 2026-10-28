import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/useAuth.js";

export default function Login() {
  const { login, getApiError } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(form);
      navigate(searchParams.get("redirect") || "/dashboard", { replace: true });
      if (!user) setError("Could not establish a session.");
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

        <h1>Welcome back</h1>
        <p>Log in to continue your journey.</p>

        <form onSubmit={handleSubmit}>
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
            placeholder="Enter your password"
            required
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />

          {error && <p className="application-error">{error}</p>}
          <button type="submit" className="primary-button full-width">
            {submitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="auth-switch">
          New to SmartHire? <Link to="/register">Create an account</Link>
        </p>

        <Link to="/" className="back-link">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}