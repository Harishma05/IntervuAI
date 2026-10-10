import { useNavigate } from "react-router-dom";

function InterviewCard({ title, type, description }) {
  const navigate = useNavigate();

  function startInterview() {
    if (type === "Resume Review") {
      navigate("/resume-review");
      return;
    }
    navigate("/session", {
      state: {
        interviewType: type,
      },
    });
  }

  const icon = type.startsWith("HR") ? "✦" : type.startsWith("DSA") ? "⌘" : type === "Resume Review" ? "▤" : "{}";
  const topic = type.startsWith("HR") ? "PEOPLE & CULTURE" : type.startsWith("DSA") ? "PROBLEM SOLVING" : type === "Resume Review" ? "HR READINESS" : "CORE JAVA";

  return (
    <article className="interview-card">
      <span className="card-icon" aria-hidden="true">{icon}</span>
      <span className="card-kicker">{topic}</span>
      <h2>{title}</h2>
      <p>{description}</p>
      <button onClick={startInterview}>Start practice <span aria-hidden="true">→</span></button>
    </article>
  );
}

export default InterviewCard;
