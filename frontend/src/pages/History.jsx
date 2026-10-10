import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getInterviewHistory, getInterviewSummary } from "../api/questionApi";

function parseFeedback(value) {
  if (!value) return null;
  try { return JSON.parse(value); } catch { return null; }
}

function History() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState([]);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [topicSummary, setTopicSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getInterviewHistory(page), getInterviewSummary()]).then(([result, summary]) => {
      setAnswers(Array.isArray(result?.content) ? result.content : []);
      setPageCount(Number(result?.totalPages) || 0);
      setTotalAnswers(Number(summary?.totalAnswers) || Number(result?.totalElements) || 0);
      setTotalSessions(Number(summary?.totalSessions) || 0);
      setTopicSummary(Array.isArray(summary?.topics) ? summary.topics : []);
    }).catch((requestError) => {
      const response = requestError?.response;
      const body = response?.data;
      const message = typeof body === "string" ? body : body?.detail || body?.message;
      setError(message || (response
        ? `Could not load history (HTTP ${response.status}). Check the backend log for details.`
        : "Can’t reach the backend. Start it, then refresh your history."));
    })
      .finally(() => setLoading(false));
  }, [page]);

  const sessions = useMemo(() => {
    const groups = new Map();
    answers.forEach((answer) => {
      const key = answer.sessionId || `older-${answer.id}`;
      if (!groups.has(key)) groups.set(key, { id: key, interviewType: answer.interviewType, date: answer.createdAt, answers: [] });
      groups.get(key).answers.push(answer);
    });
    groups.forEach((session) => session.answers.sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt)));
    return [...groups.values()].sort((left, right) => new Date(right.date) - new Date(left.date));
  }, [answers]);

  const skills = useMemo(() => {
    return topicSummary.filter((item) => item.topic !== "Resume-based HR")
      .map((item) => ({ interviewType: item.interviewType, topic: item.topic || "General", count: item.answerCount || 0, average: Number(item.averageScore) || 0 }))
      .sort((a, b) => a.average - b.average);
  }, [topicSummary]);

  return <><Navbar /><main className="setup-page history-page">
    <div className="setup-heading"><div><span className="eyebrow"><span className="eyebrow-dot" /> YOUR PROGRESS</span><h1>Practice history</h1><p>Review your past sessions, track topic scores, and choose what to practise next.</p></div><button className="secondary-button" onClick={() => navigate("/interview")}>Start a session →</button></div>
    {loading && <p role="status">Loading your history…</p>}
    {error && <p className="error-message" role="alert">{error}</p>}
    {!loading && !error && answers.length === 0 && <section className="history-empty"><span aria-hidden="true">◷</span><h2>Your practice journey starts here</h2><p>Complete an interview to see your answers, scores, and topic recommendations.</p><button onClick={() => navigate("/interview")}>Choose a practice session →</button></section>}
    {!loading && !error && answers.length > 0 && <>
      <div className="history-overview"><div><span>TOTAL SESSIONS</span><strong>{totalSessions}</strong></div><div><span>ANSWERS REVIEWED</span><strong>{totalAnswers}</strong></div><div><span>TOPICS TRACKED</span><strong>{skills.length}</strong></div></div>
      {skills.length > 0 && <section className="skill-map"><div className="skill-map-heading"><div><span className="eyebrow">PERSONALIZED FOCUS</span><h2>Areas to strengthen</h2></div></div>{skills.slice(0, 4).map((skill, index) => <div className="skill-row" key={skill.topic}><div className="skill-row-meta"><strong>{skill.topic}</strong><span>{skill.average.toFixed(1)}/10 average</span></div><div className="skill-track"><span style={{ width: `${Math.max(0, Math.min(100, skill.average * 10))}%` }} /></div><small>{skill.count} scored {skill.count === 1 ? "answer" : "answers"}{index === 0 ? " · start here for your next practice" : ""}</small></div>)}<button className="history-focus-button" onClick={() => navigate("/session", { state: { interviewType: skills[0].interviewType, topic: skills[0].topic } })}>Practise your top focus →</button></section>}
      <div className="history-session-list">{sessions.map((session) => {
        const score = session.answers.reduce((sum, answer) => sum + (Number(answer.score) || 0), 0);
        const average = session.answers.length ? (score / session.answers.length).toFixed(1) : "0.0";
        return <article className="history-session" key={session.id}>
          <header><div><span className="card-kicker">{new Date(session.date).toLocaleString()}</span><h2>{session.interviewType}</h2></div><span className="history-average">{average}<small>/10 avg</small></span></header>
          <div className="history-answer-list">{session.answers.map((answer) => {
            const feedback = parseFeedback(answer.feedback);
            return <div className="history-answer" key={answer.id}><span><strong>{answer.topic || "General"}</strong><small>{answer.question}</small><p>{answer.answer}</p>{feedback?.suggestions?.length > 0 && <p><b>Suggestion:</b> {feedback.suggestions[0]}</p>}{feedback?.followUpQuestions?.length > 0 && <p><b>Follow-up:</b> {feedback.followUpQuestions[0]}</p>}</span><b>{answer.score ?? "—"}<small>/10</small></b></div>;
          })}</div>
        </article>;
      })}</div>
      {pageCount > 1 && <nav className="history-pagination" aria-label="History pages">
        <button className="secondary-button" type="button" disabled={page === 0 || loading} onClick={() => { setLoading(true); setError(""); setPage((current) => current - 1); }}>← Newer</button>
        <span>Page {page + 1} of {pageCount}</span>
        <button className="secondary-button" type="button" disabled={page + 1 >= pageCount || loading} onClick={() => { setLoading(true); setError(""); setPage((current) => current + 1); }}>Older →</button>
      </nav>}
    </>}
  </main></>;
}

export default History;
