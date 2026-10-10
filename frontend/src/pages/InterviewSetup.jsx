import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getQuestions } from "../api/questionApi";

const INTERVIEW_TYPES = [
  { value: "HR", label: "HR interview", description: "Behavioral questions, communication, and workplace scenarios." },
  { value: "DSA", label: "Data structures & algorithms", description: "Problem solving with arrays, trees, graphs, and algorithms." },
  { value: "Java", label: "Java interview", description: "Core Java, object-oriented design, collections, and concurrency." },
];

function InterviewSetup() {
  const navigate = useNavigate();
  const [interviewType, setInterviewType] = useState("HR");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const activeType = INTERVIEW_TYPES.find((item) => item.value === interviewType);
  const topics = useMemo(() => [...new Set(questions.filter((question) => !difficulty || question.difficulty === difficulty).map((question) => question.topic).filter(Boolean))].sort(), [questions, difficulty]);
  const difficulties = useMemo(() => [...new Set(questions.filter((question) => !topic || question.topic === topic).map((question) => question.difficulty).filter(Boolean))].sort(), [questions, topic]);

  useEffect(() => {
    let active = true;
    getQuestions(interviewType)
      .then((data) => active && setQuestions(Array.isArray(data) ? data : []))
      .catch((requestError) => {
        if (!active) return;
        const response = requestError?.response;
        const body = response?.data;
        const serverMessage = typeof body === "string" ? body : body?.detail || body?.message || body?.error;
        if (response?.status === 401) {
          setError("Your sign-in session expired. Sign out, sign in again, then reopen the practice room.");
        } else if (serverMessage) {
          setError(`Could not load topics: ${serverMessage}`);
        } else if (response) {
          setError(`Could not load topics (HTTP ${response.status}). Check the backend terminal for details.`);
        } else {
          setError("Can’t reach the backend at http://localhost:8080. Start it in its terminal, then refresh this page.");
        }
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [interviewType]);

  function chooseInterviewType(value) {
    setInterviewType(value);
    setTopic("");
    setDifficulty("");
    setError("");
    setLoading(true);
    setQuestions([]);
  }

  function startPractice(event) {
    event.preventDefault();
    navigate("/session", {
      state: {
        interviewType: interviewType === "HR" ? "HR Interview" : interviewType === "DSA" ? "DSA Interview" : "Java Interview",
        topic,
        difficulty,
      },
    });
  }

  return <><Navbar /><main className="setup-page">
    <div className="setup-heading">
      <div><span className="eyebrow"><span className="eyebrow-dot" /> PRACTICE ROOM</span><h1>Build your practice session</h1><p>Choose an interview type, focus area, and difficulty. We’ll tailor a structured set of questions for you.</p></div>
      <Link className="back-link" to="/">← Back to home</Link>
    </div>
    <form className="practice-builder" onSubmit={startPractice}>
      <div className="practice-type-list" role="group" aria-label="Interview type">
        {INTERVIEW_TYPES.map((item) => <button key={item.value} type="button" className={`practice-type-card${interviewType === item.value ? " selected" : ""}`} onClick={() => chooseInterviewType(item.value)} aria-pressed={interviewType === item.value}>
          <span className="practice-type-icon" aria-hidden="true">{item.value === "HR" ? "✦" : item.value === "DSA" ? "⌘" : "{}"}</span><span><strong>{item.label}</strong><small>{item.description}</small></span><span className="practice-type-check" aria-hidden="true">{interviewType === item.value ? "✓" : ""}</span>
        </button>)}
      </div>
      <div className="practice-options">
        <label>Topic
          <select value={topic} onChange={(event) => { const nextTopic = event.target.value; setTopic(nextTopic); if (difficulty && !questions.some((question) => (!nextTopic || question.topic === nextTopic) && question.difficulty === difficulty)) setDifficulty(""); }} disabled={loading || topics.length === 0}>
            <option value="">All topics</option>{topics.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </label>
        <label>Difficulty
          <select value={difficulty} onChange={(event) => { const nextDifficulty = event.target.value; setDifficulty(nextDifficulty); if (topic && !questions.some((question) => question.topic === topic && (!nextDifficulty || question.difficulty === nextDifficulty))) setTopic(""); }} disabled={loading || difficulties.length === 0}>
            <option value="">Any difficulty</option>{difficulties.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </label>
      </div>
      {error && <p className="error-message" role="alert">{error}</p>}
      <div className="practice-builder-footer"><span>{loading ? "Loading question bank…" : `${questions.length} questions available · ${activeType.label}`}</span><button type="submit" disabled={loading || Boolean(error) || questions.length === 0}>Start interview <span aria-hidden="true">→</span></button></div>
    </form>
    <section className="resume-prompt"><span className="resume-prompt-icon" aria-hidden="true">▤</span><div><strong>Want questions based on your own resume?</strong><p>Get a focused resume review and practise questions tailored to your experience.</p></div><Link to="/resume-review">Review my resume →</Link></section>
  </main></>;
}

export default InterviewSetup;
