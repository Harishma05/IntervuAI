
import { useState } from "react";
import "./InterviewSession.css";

const questions = [
  "Tell me about yourself.",
  "What are your strengths?",
  "What are your weaknesses?",
  "Explain OOP in Java.",
  "Why do you want to join our company?"
];



function InterviewSession() {
    
    const [answer, setAnswer] = useState("");
    const [currentQuestion, setCurrentQuestion] = useState(0);

function handleSubmit() {
  if (currentQuestion < questions.length - 1) {
    setCurrentQuestion(currentQuestion + 1);
    setAnswer("");
  } else {
    alert("🎉 Interview Completed!");
  }
}
  return (
    
    <div className="session-page">
      <h1>🤖 AI Interview</h1>

      <h2>
     Question {currentQuestion + 1} of {questions.length}
     </h2>
      <p>{questions[currentQuestion]}</p>

     <textarea
      placeholder="Type your answer here..."
      rows="8"
      value={answer}
       onChange={(event) => setAnswer(event.target.value)}
      ></textarea>
      <h3>Your Answer:</h3>

      <p>{answer}</p>

      <br />

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