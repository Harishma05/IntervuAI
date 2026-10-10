import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getCoachProfile, getSkillLevel } from "../utils/interviewCoach";
import { useAuth } from "../context/AuthContext";
import { getInterviewHistory, getInterviewSummary } from "../api/questionApi";

function Results() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { user } = useAuth();
  const [savedResult, setSavedResult] = useState(null);
  const [savedSessionCount, setSavedSessionCount] = useState(null);
  const profile = state?.profile || getCoachProfile(user?.id);
  const latestSession = state?.session || null;
  const answers = state?.answers || latestSession?.answers || savedResult?.answers || [];

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    const hasCurrentResult = state?.answers?.length || state?.session?.answers?.length;
    getInterviewSummary().then((summary) => {
      if (active) setSavedSessionCount(Number(summary?.totalSessions) || 0);
    }).catch(() => {});
    if (hasCurrentResult) return () => { active = false; };
    getInterviewHistory(0, 100).then((history) => {
      if (!active) return;
      const records = Array.isArray(history?.content) ? history.content : [];
      if (!records.length) return;
      const latestSessionId = records[0].sessionId;
      const sessionRecords = latestSessionId
        ? records.filter((answer) => answer.sessionId === latestSessionId)
        : [records[0]];
      const restoredAnswers = sessionRecords.reverse().map((record) => {
        let feedback = {};
        try { feedback = JSON.parse(record.feedback || "{}"); } catch { /* Older answer feedback may not be JSON. */ }
        return { ...feedback, question: record.question, answer: record.answer, score: record.score, topic: record.topic };
      });
      setSavedResult({ answers: restoredAnswers, interviewType: sessionRecords[0]?.interviewType });
    }).catch(() => { if (active) setSavedResult(null); });
    return () => { active = false; };
  }, [state, user]);

  const totalScore = answers.reduce((total, item) => total + (Number(item.score) || 0), 0);
  const average = answers.length ? Math.round((totalScore / (answers.length * 10)) * 100) : 0;
  const skills = Object.entries(profile.skills).sort((left, right) => left[1].average - right[1].average);
  const focusSkill = skills[0];

  return (
    <><Navbar /><main className="session-page results-page">
      <span className="eyebrow"><span className="eyebrow-dot" /> SESSION SUMMARY</span>
      <h1>{answers.length ? "Nice work. You showed up." : "No results yet"}</h1>
      {answers.length ? <>
        <p className="results-subtitle">{state?.interviewType || latestSession?.interviewType || savedResult?.interviewType || "Interview"} · {answers.length} questions completed · {savedSessionCount ?? profile.sessionCount ?? 0} practice {(savedSessionCount ?? profile.sessionCount ?? 0) === 1 ? "session" : "sessions"} saved</p>
        <div className="results-score"><strong>{average}%</strong><span>Overall score<br /><b>{totalScore} of {answers.length * 10} points</b></span></div>
        {focusSkill && <div className="coach-next"><span className="coach-next-icon">✳</span><span><small>YOUR NEXT FOCUS</small><strong>{focusSkill[0]}</strong><span>Your coach will bring this skill into a future practice session.</span></span></div>}
        {skills.length > 0 && <section className="skill-map"><div className="skill-map-heading"><div><span className="eyebrow">YOUR SKILL MAP</span><h2>Progress across topics</h2></div><span className="skill-map-count">{skills.length} skills tracked</span></div>
          {skills.map(([topic, skill]) => <div className="skill-row" key={topic}><div className="skill-row-meta"><strong>{topic}</strong><span className={`skill-level ${getSkillLevel(skill.average).toLowerCase().replaceAll(" ", "-")}`}>{getSkillLevel(skill.average)}</span></div><div className="skill-track"><span style={{ width: `${skill.average * 10}%` }} /></div><small>{skill.average}/10 average · {skill.attempts} {skill.attempts === 1 ? "answer" : "answers"}</small></div>)}
        </section>}
        {answers.map((item, index) => <article key={`${item.question}-${index}`} className="feedback-card">
          <h3><span className="result-number">0{index + 1}</span> {item.question} <em className="result-points">{item.score}/10</em></h3>
          {item.previousAttempt ? <div className="revision-comparison"><div><span>FIRST ATTEMPT · {item.previousAttempt.score}/10</span><p>{item.previousAttempt.answer}</p></div><div><span>REVISED ANSWER · {item.score}/10</span><p>{item.answer}</p></div></div> : <p><strong>Your answer</strong><br />{item.answer}</p>}
          {item.recommendedDifficulty && <p><strong>Recommended next level:</strong> {item.recommendedDifficulty}</p>}
          {item.suggestions?.length > 0 && <><h4>Suggestions</h4><ul>{item.suggestions.map((suggestion, i) => <li key={i}>{suggestion}</li>)}</ul></>}
          {item.followUpQuestions?.length > 0 && <><h4>Follow-up questions to practise</h4><ul>{item.followUpQuestions.map((followUp, i) => <li key={i}>{followUp}</li>)}</ul></>}
        </article>)}
      </> : <><p>Start an interview to see your score and feedback here.</p>{skills.length > 0 && <section className="skill-map"><h2>Your skill map</h2>{skills.map(([topic, skill]) => <div className="skill-row" key={topic}><div className="skill-row-meta"><strong>{topic}</strong><span>{getSkillLevel(skill.average)}</span></div><div className="skill-track"><span style={{ width: `${skill.average * 10}%` }} /></div></div>)}</section>}</>}

      <div className="session-actions"><button onClick={() => navigate("/interview")}>Practice again <span aria-hidden="true">→</span></button><button className="secondary-button" onClick={() => navigate("/")}>Go home</button></div>
    </main></>
  );
}

export default Results;
