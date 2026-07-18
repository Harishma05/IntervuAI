import { useNavigate } from "react-router-dom";

function Hero() {
  const navigate = useNavigate();

  return (
    <section>
      <h1>Ace Your Technical Interviews</h1>

      <h2>Practice with an AI interviewer</h2>

      <p>
        Practice with an AI interviewer that adapts
        to your strengths and weaknesses.
      </p>

      <button onClick={() => navigate("/interview")}>
        Start Interview
      </button>
    </section>
  );
}

export default Hero;