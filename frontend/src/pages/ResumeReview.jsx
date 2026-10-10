import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { reviewResume } from "../api/aiApi";

const REVIEW_SECTIONS = [
  ["Strengths", "strengths"],
  ["Areas to improve", "gaps"],
  ["Practical suggestions", "suggestions"],
  ["Questions an interviewer may ask", "interviewQuestions"],
];

function ResumeReview() {
  const navigate = useNavigate();
  const [resumeFile, setResumeFile] = useState(null);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleReview(event) {
    event.preventDefault();
    if (!resumeFile || loading) return;
    setLoading(true);
    setError("");
    setReview(null);
    try {
      setReview(await reviewResume(resumeFile));
    } catch (requestError) {
      const response = requestError?.response;
      const responseMessage = response?.data?.detail || response?.data?.message || response?.data?.error;
      if (responseMessage) {
        setError(`${responseMessage}${response.status ? ` (HTTP ${response.status})` : ""}`);
      } else if (response?.status) {
        setError(`The server returned HTTP ${response.status}. Check the backend terminal for the resume processing or Groq error.`);
      } else {
        setError("The request could not reach the API. Check that the backend is running and that the frontend origin is allowed by CORS.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(event) {
    const selected = event.target.files?.[0] || null;
    setReview(null);
    setError("");
    if (!selected) {
      setResumeFile(null);
      return;
    }
    const allowedExtension = /\.(pdf|docx|txt)$/i.test(selected.name);
    if (!allowedExtension) {
      setResumeFile(null);
      setError("Choose a PDF, DOCX, or TXT resume file.");
      event.target.value = "";
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setResumeFile(null);
      setError("The file is too large. Choose a resume under 5 MB.");
      event.target.value = "";
      return;
    }
    setResumeFile(selected);
  }

  return (
    <>
      <Navbar />
      <main className="session-page resume-page">
        <button className="text-button" onClick={() => navigate("/interview")}>← Back to practice options</button>
        <span className="eyebrow"><span className="eyebrow-dot" /> HR READINESS</span>
        <h1>Give your resume a thoughtful review.</h1>
        <p className="resume-intro">Upload your resume for a constructive review of how clearly your experience comes across, plus likely HR questions grounded in what you’ve written.</p>

        <form className="resume-form" onSubmit={handleReview}>
          <label className="resume-form-heading" htmlFor="resume-file"><span>Choose your resume file</span><span>PDF, DOCX, or TXT · up to 5 MB</span></label>
          <input className="resume-file-input" id="resume-file" type="file" accept=".pdf,.docx,.txt,application/pdf,text/plain" onChange={handleFileChange} disabled={loading} />
          {resumeFile && <div className="selected-file"><span aria-hidden="true">▤</span><span><strong>{resumeFile.name}</strong><small>{(resumeFile.size / 1024).toFixed(0)} KB · ready to review</small></span><button type="button" aria-label="Remove selected resume" onClick={() => { setResumeFile(null); setReview(null); }}>×</button></div>}
          <p className="resume-privacy">The file is processed for text and sent to Groq for analysis; IntervuAI doesn’t store it. Avoid uploading sensitive personal details. Scanned image-only PDFs aren’t supported yet.</p>
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={!resumeFile || loading}>{loading ? "Reviewing your resume…" : "Review my resume"}<span aria-hidden="true">→</span></button>
        </form>

        {review && <section className="resume-results" aria-live="polite">
          <div className="resume-score-card">
            <div className="resume-score-ring" style={{ "--resume-score": `${review.score}%` }}><span>{review.score}<small>/100</small></span></div>
            <div><span className="card-kicker">RESUME READINESS</span><h2>Your experience, at a glance</h2><p>{review.summary}</p><small>This score reflects resume clarity and relevance. It is not a prediction of hiring outcomes.</small></div>
          </div>
          <div className="resume-review-grid">
            {REVIEW_SECTIONS.map(([title, key]) => Array.isArray(review[key]) && review[key].length > 0 && <article className="resume-review-card" key={key}>
              <h3>{title}</h3>
              <ul>{review[key].map((item, index) => <li key={`${key}-${index}`}>{item}</li>)}</ul>
            </article>)}
          </div>
          <div className="resume-review-actions"><button className="secondary-button" onClick={() => { setReview(null); setResumeFile(null); }}>Review another resume</button><button className="primary-button" onClick={() => navigate("/session", { state: { interviewType: "HR Interview", customQuestions: review.interviewQuestions } })}>Practice these questions →</button></div>
        </section>}
      </main>
    </>
  );
}

export default ResumeReview;
