import { useNavigate } from "react-router-dom";

function Hero() {
  const navigate = useNavigate();

  return (
    <main className="hero-wrap">
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> YOUR PERSONAL AI INTERVIEW COACH</span>
          <h1>Turn interview nerves into <span>confidence.</span></h1>
          <p>Practice realistic questions, get thoughtful feedback, and build the skills to walk into your next interview prepared.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => navigate("/interview")}>Build my practice plan <span aria-hidden="true">↗</span></button>
            <a className="text-link" href="#how-it-works">Explore the platform</a>
          </div>
          <div className="hero-proof">
            <span className="proof-mark" aria-hidden="true">✦</span>
            <span>Practice with purpose. Improve one answer at a time.</span>
          </div>
        </div>
        <div className="hero-visual" aria-label="Preview of an interview practice session">
          <div className="visual-orbit" />
          <div className="interview-preview">
            <div className="preview-top"><span className="preview-label">A look inside your practice</span><span className="live-pill">AI COACH</span></div>
            <p className="preview-question">Tell me about a challenge you solved and what you learned.</p>
            <div className="preview-answer">I started by breaking the problem into smaller parts and identifying the biggest risk…</div>
            <div className="preview-bottom"><div className="mini-score"><span className="score-ring">8.4</span><span>Answer quality<br /><strong>Clear and focused</strong></span></div><span className="preview-label">02 / 05</span></div>
          </div>
          <div className="sparkle-card"><span className="sparkle-icon">✳</span><span><strong>Useful feedback</strong><small>Know what to improve next</small></span></div>
        </div>
      </section>
      <div className="feature-strip" id="how-it-works">
        <div className="feature-item"><span className="feature-icon">◷</span><span><strong>Structured practice</strong><small>Technical and HR interview sessions</small></span></div>
        <div className="feature-item"><span className="feature-icon">✳</span><span><strong>Personal coaching</strong><small>Strengths, gaps, and suggested next steps</small></span></div>
        <div className="feature-item"><span className="feature-icon">↗</span><span><strong>Visible progress</strong><small>Track scores and focus areas over time</small></span></div>
      </div>
    </main>
  );
}

export default Hero;
