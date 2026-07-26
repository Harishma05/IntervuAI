import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getQuestions, saveAnswer } from "../api/questionApi";
import "./InterviewSession.css";

function InterviewSession() {
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [questions, setQuestions] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  // Example: "DSA Interview"
  const interviewType =
    location.state?.interviewType || "DSA Interview";

  // Convert "DSA Interview" -> "DSA"
  const apiType = interviewType.replace(" Interview", "");

  useEffect(() => {
    async function loadQuestions() {
      try {
        const data = await getQuestions(apiType);
        setQuestions(data);
      } catch (error) {
        console.error("Error loading questions:", error);
      }
    }

    loadQuestions();
  }, [apiType]);

  async function handleSubmit() {
  try {
    await saveAnswer({
      interviewType: interviewType,
      question: questions[currentQuestion].question,
      answer: answer,
    });

    const newAnswers = [
      ...answers,
      {
        question: questions[currentQuestion].question,
        answer: answer,
      },
    ];

    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setAnswer("");
    } else {
      setIsCompleted(true);
    }
  } catch (error) {
    console.error("Error saving answer:", error);
  }
}
  function restartInterview() {
    setCurrentQuestion(0);
    setAnswer("");
    setAnswers([]);
    setIsCompleted(false);
  }

  if (questions.length === 0) {
    return (
      <div className="session-page">
        <h2>Loading Questions...</h2>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="session-page">
        <h1>🎉 Interview Completed</h1>

        <h2>Great Job!</h2>

        <p>You answered all {questions.length} questions successfully.</p>

        <h2>
          Score: {questions.length} / {questions.length}
        </h2>

        <hr />

        <h2>Your Responses</h2>

        {answers.map((item, index) => (
          <div
            key={index}
            style={{ textAlign: "left", marginBottom: "20px" }}
          >
            <h3>Question {index + 1}</h3>

            <p>
              <strong>Question:</strong> {item.question}
            </p>

            <p>
              <strong>Answer:</strong> {item.answer}
            </p>

            <hr />
          </div>
        ))}

        <button onClick={restartInterview}>
          Restart Interview
        </button>

        <button
          onClick={() => navigate("/")}
          style={{ marginLeft: "10px" }}
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="session-page">
      <h1>🤖 {interviewType}</h1>

      <div className="progress-container">
        <div
          className="progress-bar"
          style={{
            width: `${((currentQuestion + 1) / questions.length) * 100}%`,
          }}
        ></div>
      </div>

      <h2>
        Question {currentQuestion + 1} of {questions.length}
      </h2>

      <p>{questions[currentQuestion]?.question}</p>

      <textarea
        placeholder="Type your answer here..."
        rows="8"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />

      <h3>Your Answer:</h3>

      <p>{answer}</p>

      <button
        onClick={handleSubmit}
        disabled={answer.trim() === ""}
      >
        Submit Answer
      </button>
    </div>
  );
}

export default InterviewSession;