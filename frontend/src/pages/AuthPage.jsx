import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AuthPage({ register = false }) {
  const { user, login, register: createAccount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  if (user) return <Navigate to={location.state?.from || "/"} replace />;

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (register) await createAccount({ displayName, email, password });
      else await login({ email, password });
      navigate(location.state?.from || "/", { replace: true });
    } catch (requestError) {
      const data = requestError?.response?.data;
      const serverMessage = typeof data === "string" ? data : data?.detail || data?.message || data?.error;
      if (serverMessage) {
        setError(serverMessage);
      } else if (requestError?.response) {
        setError(`The server returned an error (HTTP ${requestError.response.status}). Check the backend terminal for details.`);
      } else {
        setError("Can’t reach IntervuAI’s backend. Start the backend in its terminal, then try signing in again.");
      }
    } finally { setLoading(false); }
  }

  return <main className="auth-page">
    <section className="auth-card">
      <Link className="brand auth-brand" to="/"><span className="brand-mark">i.</span>IntervuAI</Link>
      <span className="eyebrow"><span className="eyebrow-dot" /> YOUR PERSONAL INTERVIEW COACH</span>
      <h1>{register ? "Create your account" : "Welcome back"}</h1>
      <p>{register ? "Save your practice history and get recommendations that improve with every session." : "Sign in to continue your interview practice."}</p>
      <form onSubmit={submit}>
        {register && <label htmlFor="display-name">Name<input id="display-name" autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required maxLength="80" /></label>}
        <label htmlFor="email">Email<input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label htmlFor="password">Password<input id="password" type="password" autoComplete={register ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength="8" maxLength="72" /></label>
        {register && <small className="auth-hint">Use at least 8 characters. Your password is stored as a secure hash.</small>}
        {error && <p role="alert" className="error-message">{error}</p>}
        <button className="primary-button" type="submit" disabled={loading}>{loading ? "Please wait…" : register ? "Create account" : "Sign in"}<span aria-hidden="true">→</span></button>
      </form>
      <p className="auth-switch">{register ? "Already have an account?" : "New to IntervuAI?"} <Link to={register ? "/login" : "/register"}>{register ? "Sign in" : "Create an account"}</Link></p>
    </section>
    <aside className="auth-aside"><span>✦</span><h2>Practice with purpose.</h2><p>Build confidence through thoughtful questions, useful feedback, and a clear view of your progress.</p></aside>
  </main>;
}

export default AuthPage;
