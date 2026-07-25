import "./InterviewCard.css";
import { useNavigate } from "react-router-dom";

function InterviewCard({ title, type, description }) {
  const navigate = useNavigate();

  function startInterview() {
    navigate("/session", {
      state: {
        interviewType: type,
      },
    });
  }

  return (
    <div className="interview-card">
      <h2>{title}</h2>

      <p>{description}</p>

      <button onClick={startInterview}>
        Start
      </button>
    </div>
  );
}

export default InterviewCard;