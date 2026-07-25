import { useNavigate } from "react-router-dom";

function Results() {
  const navigate = useNavigate();

  return (
    <div className="session-page">
      <h1>🎉 Interview Results</h1>

      <h2>Congratulations!</h2>

      <p>You completed the interview successfully.</p>

      <button onClick={() => navigate("/")}>
        Go Home
      </button>
    </div>
  );import { useNavigate } from "react-router-dom";

function Results() {
  const navigate = useNavigate();

  return (
    <div className="session-page">
      <h1>🎉 Interview Results</h1>

      <h2>Congratulations!</h2>

      <p>You completed the interview successfully.</p>

      <button onClick={() => navigate("/")}>
        Go Home
      </button>
    </div>
  );
}

export default Results;
}

export default Results;
