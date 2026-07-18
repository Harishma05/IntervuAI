import "./InterviewCard.css";
import { useNavigate } from "react-router-dom";
function InterviewCard({ title, description }) {
    const navigate = useNavigate();
  return (
    <div className="interview-card">
      <h2>{title}</h2>

      <p>{description}</p>

      <button onClick={() => navigate("/session")}>
  Start
</button>
    </div>
  );
}

export default InterviewCard;