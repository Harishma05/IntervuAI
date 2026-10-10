import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { evaluateAnswer, transcribeAudio } from "../api/aiApi";
import { runCode } from "../api/codeApi";
import { getInterviewSummary, getQuestions, saveAnswer } from "../api/questionApi";
import Navbar from "../components/Navbar";
import { chooseAdaptiveQuestions, chooseHrQuestions, getCoachProfile, recordInterview } from "../utils/interviewCoach";
import { useAuth } from "../context/AuthContext";

const QUESTION_COUNT = 5;
const STARTER_CODE = {
  Java: "class Solution {\n    // Add the method signature required by the prompt.\n\n}",
  Python: "class Solution:\n    # Add the method signature required by the prompt.\n    pass",
  JavaScript: "class Solution {\n  // Add the method required by the prompt.\n}",
  "C++": "class Solution {\npublic:\n    // Add the method signature required by the prompt.\n};",
};
const TWO_SUM_STARTER_CODE = {
  Java: "class Solution {\n    public int[] solve(int[] nums, int target) {\n        // Return the indices of two values that add up to target.\n        return new int[0];\n    }\n}",
  Python: "class Solution:\n    def solve(self, nums, target):\n        # Return the indices of two values that add up to target.\n        return []",
  JavaScript: "class Solution {\n  solve(nums, target) {\n    // Return the indices of two values that add up to target.\n    return [];\n  }\n}",
  "C++": "class Solution {\npublic:\n    vector<int> solve(vector<int>& nums, int target) {\n        // Return the indices of two values that add up to target.\n        return {};\n    }\n};",
};

const STOCK_STARTER_CODE = {
  Java: "class Solution {\n    public int maxProfit(int[] prices) {\n        // Return the best profit from one buy and one later sell.\n        return 0;\n    }\n}",
  Python: "class Solution:\n    def maxProfit(self, prices):\n        # Return the best profit from one buy and one later sell.\n        return 0",
  JavaScript: "class Solution {\n  maxProfit(prices) {\n    // Return the best profit from one buy and one later sell.\n    return 0;\n  }\n}",
  "C++": "class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        // Return the best profit from one buy and one later sell.\n        return 0;\n    }\n};",
};

function hasCodeRunnerSupport(question) {
  return /^(Two Sum|Best Time to Buy and Sell Stock)$/i.test(question?.title || "");
}

function getDsaStarterCode(question, language) {
  if (/^Two Sum$/i.test(question?.title || "")) return TWO_SUM_STARTER_CODE[language];
  if (/^Best Time to Buy and Sell Stock$/i.test(question?.title || "")) return STOCK_STARTER_CODE[language];
  return STARTER_CODE[language];
}

function buildDsaAnswer({ language, code, reasoning, timeComplexity, spaceComplexity }) {
  return [
    `Language: ${language}`,
    "Solution:",
    code.trim(),
    "Approach and reasoning:",
    reasoning.trim(),
    `Time complexity: ${timeComplexity.trim() || "Not provided"}`,
    `Space complexity: ${spaceComplexity.trim() || "Not provided"}`,
  ].join("\n\n");
}

function getDsaEvaluationPrompt(question) {
  return [
    `Coding challenge: ${question.title}`,
    `Topic: ${question.topic || "Algorithms"}; difficulty: ${question.difficulty || "Unspecified"}.`,
    `Problem: ${question.problemStatement || question.title}`,
    question.expectedTimeComplexity ? `Expected time complexity: ${question.expectedTimeComplexity}.` : "",
    question.expectedSpaceComplexity ? `Expected space complexity: ${question.expectedSpaceComplexity}.` : "",
    "Evaluate the submitted code and explanation for correctness, algorithm choice, edge cases, and stated complexity. Explain concrete improvements.",
  ].filter(Boolean).join("\n").slice(0, 1900);
}

function DsaWorkspace({ question, language, onLanguageChange, code, onCodeChange, reasoning, onReasoningChange, timeComplexity, onTimeComplexityChange, spaceComplexity, onSpaceComplexityChange, submitting, error, submitLabel = "Review my solution", runTestsAvailable, runPending, runResult, runError, onRunTests }) {
  const lineCount = Math.max(1, code.split("\n").length);
  function insertIndent(event) {
    if (event.key !== "Tab") return;
    event.preventDefault();
    const field = event.currentTarget;
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const updated = `${code.slice(0, start)}    ${code.slice(end)}`;
    onCodeChange(updated);
    requestAnimationFrame(() => field.setSelectionRange(start + 4, start + 4));
  }

  return <div className="dsa-workspace">
    <section className="dsa-problem-panel" aria-label="Problem details">
      <div className="dsa-panel-kicker"><span className="dsa-kicker-icon">⌘</span> THE CHALLENGE</div>
      <h2>{question.title}</h2>
      <p className="dsa-problem-statement">{question.problemStatement || "Solve the challenge and explain the reasoning behind your approach."}</p>
      <div className="dsa-meta-row">
        <span className={`dsa-difficulty dsa-difficulty-${(question.difficulty || "medium").toLowerCase()}`}>{question.difficulty || "Practice"}</span>
        <span>{question.topic || "Algorithms"}</span>
      </div>
      {(question.sampleInput || question.sampleOutput) && <section className="dsa-example-card" aria-label="Example test case">
        <div className="dsa-example-heading"><span>EXAMPLE</span><small>Trace it by hand</small></div>
        {question.sampleInput && <div className="dsa-example-value"><span>INPUT</span><code>{question.sampleInput}</code></div>}
        {question.sampleOutput && <div className="dsa-example-value"><span>EXPECTED OUTPUT</span><code>{question.sampleOutput}</code></div>}
      </section>}
      {question.keyConcepts && <div className="dsa-concepts"><span>CONCEPTS</span><p>{question.keyConcepts}</p></div>}
      <details className="dsa-edge-cases"><summary>Edge-case checklist</summary><ul>
        <li>What is the smallest valid input?</li>
        <li>Could values repeat or be negative?</li>
        <li>What should happen when no solution exists, if the prompt allows it?</li>
      </ul></details>
      <div className="dsa-coach-tip"><span aria-hidden="true">✦</span><p><strong>Think out loud</strong>Describe your approach, edge cases, and time and space complexity.</p></div>
    </section>

    <section className="dsa-editor-panel" aria-label="Write your solution">
      <div className="dsa-editor-toolbar">
        <div className="dsa-editor-file"><span className="dsa-file-dot" /> solution <span className="dsa-file-extension">.{language === "C++" ? "cpp" : language === "JavaScript" ? "js" : language.toLowerCase()}</span></div>
        <label className="dsa-language-picker"><span>LANGUAGE</span><select value={language} onChange={(event) => onLanguageChange(event.target.value)} disabled={submitting || runPending} aria-label="Programming language">{Object.keys(STARTER_CODE).map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      <div className="dsa-editor-heading"><div><span className="dsa-live-dot" /> <strong>Solution editor</strong></div><small>{runTestsAvailable ? "Isolated test runner · AI review" : "AI review · isolated tests are not available for this challenge yet"}</small></div>
      <div className="dsa-code-editor">
        <div className="dsa-line-numbers" aria-hidden="true">{Array.from({ length: lineCount }, (_, index) => <span key={index}>{index + 1}</span>)}</div>
        <textarea aria-label={`${language} solution code`} spellCheck="false" autoCapitalize="off" autoCorrect="off" autoComplete="off" wrap="off" value={code} onChange={(event) => onCodeChange(event.target.value)} onKeyDown={insertIndent} disabled={submitting || runPending} maxLength={10000} />
      </div>
      <div className="dsa-editor-status"><span>{language}</span><span>{lineCount} lines <i>·</i> {code.length} characters</span></div>

      <label className="dsa-field-label" htmlFor="dsa-reasoning">Your approach <span>Required</span></label>
      <textarea id="dsa-reasoning" className="dsa-reasoning" placeholder="How does your solution work? Which edge cases did you consider?" rows="4" value={reasoning} onChange={(event) => onReasoningChange(event.target.value)} disabled={submitting} maxLength={4000} />
      <div className="dsa-complexity-fields">
        <label htmlFor="dsa-time">Time complexity<input id="dsa-time" value={timeComplexity} onChange={(event) => onTimeComplexityChange(event.target.value)} placeholder="e.g. O(n)" disabled={submitting} maxLength={100} /></label>
        <label htmlFor="dsa-space">Space complexity<input id="dsa-space" value={spaceComplexity} onChange={(event) => onSpaceComplexityChange(event.target.value)} placeholder="e.g. O(n)" disabled={submitting} maxLength={100} /></label>
      </div>
      {runTestsAvailable ? <>
        <button className="dsa-run-button" type="button" onClick={onRunTests} disabled={runPending || submitting}>{runPending ? "Running isolated tests…" : "▶ Run visible + hidden tests"}</button>
        {runError && <p className="error-message" role="alert">{runError}</p>}
        {runResult && <div className={`dsa-run-result${runResult.passed ? " is-passed" : " is-failed"}`} role="status">
          <div className="dsa-run-result-heading"><strong>{runResult.passed ? "All tests passed" : runResult.status.replaceAll("_", " ")}</strong><span>{runResult.time ? `${runResult.time}s` : ""}{runResult.memory ? ` · ${Math.round(runResult.memory / 1024)} KB` : ""}</span></div>
          {runResult.visibleTests?.map((test) => <div className="dsa-visible-test" key={test.testNumber}><span>{test.passed ? "✓" : "×"} Sample test</span><small>{test.passed ? "Passed" : `Expected ${test.expectedOutput}; received ${test.actualOutput || "no output"}`}</small></div>)}
          {runResult.status === "COMPILATION_ERROR" || runResult.status === "RUNTIME_ERROR" || runResult.status === "TIME_LIMIT_EXCEEDED" ? <pre className="dsa-run-details">{runResult.message}</pre> : <p>{runResult.message}</p>}
          {["ACCEPTED", "WRONG_ANSWER"].includes(runResult.status) && runResult.hiddenTotal > 0 && <div className="dsa-hidden-result"><span aria-hidden="true">◈</span><strong>{runResult.hiddenPassed} / {runResult.hiddenTotal}</strong><small>private edge cases passed</small></div>}
        </div>}
      </> : <p className="dsa-runner-note">Private test execution is not configured for this challenge yet. You can still submit this solution for AI review.</p>}
      {error && <p className="error-message" role="alert">{error}</p>}
      <button className="dsa-submit-button" type="submit" disabled={!code.trim() || !reasoning.trim() || submitting}>{submitting ? "Reviewing your solution…" : submitLabel}<span aria-hidden="true">→</span></button>
    </section>
  </div>;
}

function requestErrorMessage(error, fallback) {
  const data = error?.response?.data;
  const message = typeof data === "string" ? data : data?.detail || data?.message || data?.error;
  if (message) return message;
  return error?.response ? `${fallback} (HTTP ${error.response.status}).` : `${fallback} Check that the backend is running.`;
}

function InterviewSession() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { user } = useAuth();
  const interviewType = state?.interviewType || "DSA Interview";
  const apiType = interviewType.replace(/ Interview$/i, "");
  const topicFilter = state?.topic || "";
  const difficultyFilter = state?.difficulty || "";
  const customQuestions = state?.customQuestions;
  const [questions, setQuestions] = useState(() => Array.isArray(customQuestions)
    ? customQuestions.map((title) => ({ title, topic: "Resume-based HR", difficulty: "Personalized" }))
    : []);
  const [serverSkills, setServerSkills] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState("");
  const [language, setLanguage] = useState("Java");
  const [code, setCode] = useState(STARTER_CODE.Java);
  const [reasoning, setReasoning] = useState("");
  const [timeComplexity, setTimeComplexity] = useState("");
  const [spaceComplexity, setSpaceComplexity] = useState("");
  const [answers, setAnswers] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [revisionMode, setRevisionMode] = useState(false);
  const [revisionAnswer, setRevisionAnswer] = useState("");
  const [loadingQuestions, setLoadingQuestions] = useState(!(Array.isArray(customQuestions) && customQuestions.length));
  const [submitting, setSubmitting] = useState(false);
  const [runPending, setRunPending] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [runError, setRunError] = useState("");
  const [error, setError] = useState("");
  const isHrInterview = /^HR Interview$/i.test(interviewType);
  const isDsaInterview = /^DSA Interview$/i.test(interviewType);
  const [voiceMode, setVoiceMode] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const answerRef = useRef("");
  const sessionIdRef = useRef(null);
  const coachProfile = getCoachProfile(user?.id);
  const weakestSkill = Object.entries(serverSkills).length
    ? Object.entries(serverSkills).sort((left, right) => left[1] - right[1]).map(([topic, average]) => [topic, { average }])[0]
    : Object.entries(coachProfile.skills).sort((left, right) => left[1].average - right[1].average)[0];

  useEffect(() => {
    if (!isHrInterview && !isDsaInterview) return undefined;
    const startedAt = Date.now();
    const timer = window.setInterval(() => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [isHrInterview, isDsaInterview]);

  useEffect(() => {
    let active = true;
    if (Array.isArray(customQuestions) && customQuestions.length) return () => { active = false; };
    Promise.all([
      getQuestions(apiType, { topic: topicFilter, difficulty: difficultyFilter }),
      getInterviewSummary().catch(() => null),
    ])
      .then(([data, summary]) => {
        if (!active) return;
        const available = Array.isArray(data) ? data : [];
        const normalizeType = (value) => (value || "").replace(/ Interview$/i, "").trim().toLowerCase();
        const skillScores = Object.fromEntries((summary?.topics || [])
          .filter((item) => normalizeType(item.interviewType) === normalizeType(apiType))
          .map((item) => [item.topic, Number(item.averageScore) || 0]));
        setServerSkills(skillScores);
        setQuestions(isHrInterview && !topicFilter && !difficultyFilter
          ? chooseHrQuestions(available, user?.id, skillScores)
          : chooseAdaptiveQuestions(available, QUESTION_COUNT, user?.id, skillScores));
        if (available.length === 0) setError(`No questions match ${[topicFilter, difficultyFilter].filter(Boolean).join(" · ") || apiType}. Try a different topic or difficulty.`);
      })
      .catch((requestError) => {
        if (active) setError(requestErrorMessage(requestError, "Could not load interview questions."));
      })
      .finally(() => active && setLoadingQuestions(false));
    return () => { active = false; };
  }, [apiType, isHrInterview, topicFilter, difficultyFilter, customQuestions, user?.id]);

  function getSessionId() {
    if (!sessionIdRef.current) sessionIdRef.current = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return sessionIdRef.current;
  }

  const question = questions[currentQuestion];
  const totalScore = useMemo(() => answers.reduce((sum, item) => sum + item.score, 0), [answers]);
  const elapsedLabel = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(elapsedSeconds % 60).padStart(2, "0")}`;

  useEffect(() => {
    if (!question) return;
    setCode((current) => Object.values(STARTER_CODE).includes(current) || Object.values(TWO_SUM_STARTER_CODE).includes(current) || Object.values(STOCK_STARTER_CODE).includes(current)
      ? getDsaStarterCode(question, language)
      : current);
    setRunResult(null);
    setRunError("");
  }, [question?.id, question?.title, language]);

  useEffect(() => { answerRef.current = answer; }, [answer]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis || !voiceMode || !question) return undefined;
    const utterance = new SpeechSynthesisUtterance(feedback
      ? `Your answer scored ${feedback.score} out of 10. ${feedback.suggestions?.[0] || feedback.weaknesses?.[0] || "Review the feedback on screen."}`
      : question.title);
    utterance.rate = 0.96;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
  }, [voiceMode, question, feedback]);

  useEffect(() => () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    window.clearTimeout(recordingTimerRef.current);
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

  async function toggleListening() {
    if (listening) {
      recorderRef.current?.stop();
      return;
    }
    if (transcribing || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setVoiceNotice(transcribing ? "Converting your recording to text…" : "Audio recording isn’t supported by this browser. You can still type your answer.");
      return;
    }
    setVoiceNotice("Requesting microphone access…");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const preferredType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = preferredType ? new MediaRecorder(stream, { mimeType: preferredType }) : new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunks.push(event.data); };
      recorder.onstart = () => {
        setListening(true);
        setVoiceNotice("Recording… Speak naturally, then select Stop & transcribe.");
      };
      recorder.onerror = () => {
        setListening(false);
        setVoiceNotice("The microphone recording failed. Check your microphone permission and try again.");
      };
      recorder.onstop = async () => {
        window.clearTimeout(recordingTimerRef.current);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setListening(false);
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        if (!blob.size) {
          setVoiceNotice("No audio was recorded. Check your microphone and try again.");
          return;
        }
        setTranscribing(true);
        setVoiceNotice("Transcribing your recording…");
        try {
          const extension = blob.type.includes("mp4") ? "mp4" : "webm";
          const result = await transcribeAudio(blob, `hr-answer.${extension}`);
          const transcript = result?.text?.trim();
          if (!transcript) throw new Error("No speech was detected. Try speaking closer to the microphone.");
          const separator = answerRef.current.trim() ? " " : "";
          const next = `${answerRef.current}${separator}${transcript}`;
          answerRef.current = next;
          setAnswer(next);
          setVoiceNotice("Transcription added to your answer. Review it before submitting.");
        } catch (err) {
          setVoiceNotice(err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Transcription failed. Try again or type your answer.");
        } finally {
          setTranscribing(false);
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      recordingTimerRef.current = window.setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 60000);
    } catch (err) {
      setListening(false);
      setVoiceNotice(err?.name === "NotAllowedError"
        ? "Microphone access is blocked. Allow it for localhost in your browser’s site settings, then try again."
        : err?.name === "NotFoundError"
          ? "No microphone was found. Connect or enable a microphone, then try again."
          : "Could not start microphone recording. Check your browser permission and try again.");
    }
  }

  function toggleVoiceMode() {
    const next = !voiceMode;
    setVoiceMode(next);
    if (!next) {
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      setListening(false);
      setVoiceNotice("");
      window.speechSynthesis?.cancel();
    } else {
      setVoiceNotice("Voice mode is on. Record your answer, then review the transcript before submitting. Audio is sent to Groq for transcription and is not stored by IntervuAI.");
    }
  }

  function changeDsaCode(nextCode) {
    setCode(nextCode);
    setRunResult(null);
    setRunError("");
  }

  function changeDsaLanguage(nextLanguage) {
    const currentStarter = getDsaStarterCode(question, language);
    if (code === currentStarter || Object.values(STARTER_CODE).includes(code) || Object.values(TWO_SUM_STARTER_CODE).includes(code) || Object.values(STOCK_STARTER_CODE).includes(code)) {
      setCode(getDsaStarterCode(question, nextLanguage));
    }
    setLanguage(nextLanguage);
    setRunResult(null);
    setRunError("");
  }

  async function handleRunTests() {
    if (!question?.id || runPending || submitting) return;
    setRunPending(true);
    setRunError("");
    setRunResult(null);
    try {
      const result = await runCode(question.id, language, code);
      setRunResult(result);
    } catch (requestError) {
      setRunError(requestErrorMessage(requestError, "Could not run the solution."));
    } finally {
      setRunPending(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const submittedAnswer = isDsaInterview ? buildDsaAnswer({ language, code, reasoning, timeComplexity, spaceComplexity }) : answer.trim();
    if (!question || !submittedAnswer.trim() || submitting || feedback) return;
    setSubmitting(true);
    setError("");
    try {
      const evaluationQuestion = isDsaInterview ? getDsaEvaluationPrompt(question) : question.title;
      const result = await evaluateAnswer(evaluationQuestion, submittedAnswer);
      const normalized = {
        question: question.title,
        topic: question.topic || apiType,
        answer: submittedAnswer,
        ...(isDsaInterview ? { language, code, reasoning, timeComplexity, spaceComplexity } : {}),
        score: Number.isFinite(Number(result?.score)) ? Math.max(0, Math.min(10, Number(result.score))) : 0,
        strengths: Array.isArray(result?.strengths) ? result.strengths : [],
        weaknesses: Array.isArray(result?.weaknesses) ? result.weaknesses : [],
        correctAnswer: result?.correctAnswer || "Review the question concepts and try to provide a complete explanation.",
        suggestions: Array.isArray(result?.suggestions) ? result.suggestions : [],
        followUpQuestions: Array.isArray(result?.followUpQuestions) ? result.followUpQuestions : [],
        recommendedDifficulty: ["Easy", "Medium", "Hard"].includes(result?.recommendedDifficulty) ? result.recommendedDifficulty : "Medium",
      };
      await saveAnswer({ interviewType, question: question.title, answer: submittedAnswer, topic: normalized.topic, score: normalized.score, sessionId: getSessionId(), feedback: JSON.stringify({ strengths: normalized.strengths, weaknesses: normalized.weaknesses, correctAnswer: normalized.correctAnswer, suggestions: normalized.suggestions, followUpQuestions: normalized.followUpQuestions, recommendedDifficulty: normalized.recommendedDifficulty }) });
      setAnswers((previous) => [...previous, normalized]);
      setFeedback(normalized);
      setRevisionAnswer(normalized.answer);
    } catch (err) {
      setError(requestErrorMessage(err, "We couldn’t evaluate and save your answer."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevision(event) {
    event.preventDefault();
    const revisedAnswer = isDsaInterview ? buildDsaAnswer({ language, code, reasoning, timeComplexity, spaceComplexity }) : revisionAnswer.trim();
    if (!question || !revisedAnswer.trim() || submitting || !feedback || feedback.previousAttempt) return;
    setSubmitting(true);
    setError("");
    try {
      const evaluationQuestion = isDsaInterview ? getDsaEvaluationPrompt(question) : question.title;
      const result = await evaluateAnswer(evaluationQuestion, revisedAnswer);
      const revised = {
        question: question.title,
        topic: question.topic || apiType,
        answer: revisedAnswer,
        ...(isDsaInterview ? { language, code, reasoning, timeComplexity, spaceComplexity } : {}),
        score: Number.isFinite(Number(result?.score)) ? Math.max(0, Math.min(10, Number(result.score))) : 0,
        strengths: Array.isArray(result?.strengths) ? result.strengths : [],
        weaknesses: Array.isArray(result?.weaknesses) ? result.weaknesses : [],
        correctAnswer: result?.correctAnswer || "Review the question concepts and try to provide a complete explanation.",
        suggestions: Array.isArray(result?.suggestions) ? result.suggestions : [],
        followUpQuestions: Array.isArray(result?.followUpQuestions) ? result.followUpQuestions : [],
        recommendedDifficulty: ["Easy", "Medium", "Hard"].includes(result?.recommendedDifficulty) ? result.recommendedDifficulty : "Medium",
      };
      await saveAnswer({ interviewType, question: question.title, answer: revisedAnswer, topic: revised.topic, score: revised.score, sessionId: getSessionId(), feedback: JSON.stringify({ strengths: revised.strengths, weaknesses: revised.weaknesses, correctAnswer: revised.correctAnswer, suggestions: revised.suggestions, followUpQuestions: revised.followUpQuestions, recommendedDifficulty: revised.recommendedDifficulty }) });
      setAnswers((previous) => previous.map((item, index) => index === currentQuestion
        ? { ...revised, previousAttempt: item }
        : item));
      setFeedback({ ...revised, previousAttempt: feedback });
      setRevisionMode(false);
    } catch (err) {
      setError(requestErrorMessage(err, "We couldn’t evaluate and save your revised answer."));
    } finally {
      setSubmitting(false);
    }
  }

  function continueInterview() {
    if (currentQuestion + 1 >= questions.length) {
      const { profile, session } = recordInterview({ interviewType, answers, userId: user.id });
      navigate("/results", { state: { interviewType, answers: session.answers, profile, session } });
      return;
    }
    setCurrentQuestion((index) => index + 1);
    setAnswer("");
    setCode(getDsaStarterCode(questions[currentQuestion + 1], language));
    setReasoning("");
    setTimeComplexity("");
    setSpaceComplexity("");
    setFeedback(null);
    setRevisionMode(false);
    setRevisionAnswer("");
    setError("");
    setRunResult(null);
    setRunError("");
  }

  if (loadingQuestions) return <><Navbar /><main className="session-page"><p role="status">Loading interview questions…</p></main></>;
  if (error && questions.length === 0) return <><Navbar /><main className="session-page"><span className="eyebrow">PRACTICE ROOM</span><h1>Interview unavailable</h1><p role="alert">{error}</p><button onClick={() => navigate("/interview")}>Choose another interview</button></main></>;
  if (!question) return <><Navbar /><main className="session-page"><h1>Interview unavailable</h1><p role="alert">No questions could be loaded.</p><button onClick={() => navigate("/interview")}>Back to interviews</button></main></>;

  return (
    <><Navbar /><main className={`session-page${isDsaInterview ? " dsa-session-page" : ""}`}>
      <button className="text-button" onClick={() => navigate("/interview")}>← Exit interview</button>
      {isHrInterview ? <header className="hr-session-header">
        <div><span className="eyebrow"><span className="eyebrow-dot" /> HR PRACTICE ROOM</span><h1>HR interview practice</h1><p>{topicFilter || difficultyFilter ? `Focused practice${topicFilter ? ` in ${topicFilter}` : " across topics"}${difficultyFilter ? ` · ${difficultyFilter}` : ""}.` : "A seven-part practice covering the key areas of a real HR interview."}</p></div>
        <div className="hr-session-timer"><span className="timer-dot" /><small>SESSION TIME</small><strong>{elapsedLabel}</strong></div>
      </header> : isDsaInterview ? <header className="dsa-session-header">
        <div><span className="eyebrow"><span className="eyebrow-dot" /> ALGORITHM PRACTICE</span><h1>DSA coding room</h1><p>Work through the problem, explain your approach, and get focused feedback.</p></div>
        <div className="hr-session-timer"><span className="timer-dot" /><small>SESSION TIME</small><strong>{elapsedLabel}</strong></div>
      </header> : <h1>{interviewType}</h1>}
      {weakestSkill && <p className="coach-note"><span aria-hidden="true">✳</span> Your coach is giving extra attention to <strong>{weakestSkill[0]}</strong> based on your past practice.</p>}
      <div className={isHrInterview || isDsaInterview ? "hr-progress-block" : ""}>
        <div className="progress-container" role="progressbar" aria-valuemin="1" aria-valuemax={questions.length} aria-valuenow={currentQuestion + 1}>
          <div className="progress-bar" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} />
        </div>
        <p className="question-count">Question {String(currentQuestion + 1).padStart(2, "0")} <span>of {String(questions.length).padStart(2, "0")}</span></p>
      </div>
      {isHrInterview ? <section className="hr-question-card">
        <div className="hr-interviewer"><span className="hr-avatar" aria-hidden="true">AI</span><span><strong>Interviewer</strong><small>People &amp; Culture</small></span><span className="question-kind">{question.topic || "GENERAL"}</span></div>
        <h2 className="question-title">{question.title}</h2>
        {question.problemStatement && <p className="question-description">{question.problemStatement}</p>}
      </section> : isDsaInterview ? null : <section className="standard-question-card"><h2 className="question-title">{question.title}</h2>{question.problemStatement && <p className="question-description">{question.problemStatement}</p>}</section>}

      {!feedback ? (
        <form onSubmit={handleSubmit}>
          {isDsaInterview && <DsaWorkspace question={question} language={language} onLanguageChange={changeDsaLanguage} code={code} onCodeChange={changeDsaCode} reasoning={reasoning} onReasoningChange={setReasoning} timeComplexity={timeComplexity} onTimeComplexityChange={setTimeComplexity} spaceComplexity={spaceComplexity} onSpaceComplexityChange={setSpaceComplexity} submitting={submitting} error={error} runTestsAvailable={Boolean(question.id) && hasCodeRunnerSupport(question)} runPending={runPending} runResult={runResult} runError={runError} onRunTests={handleRunTests} />}
          {isHrInterview && <div className="voice-controls">
            <div><strong>Choose how to respond</strong><small>{voiceMode ? "Speak your answer or type it below." : "Type your answer, or turn on voice practice."}</small></div>
            <button className="secondary-button" type="button" onClick={toggleVoiceMode}>{voiceMode ? "Turn voice off" : "Enable voice mode"}</button>
          </div>}
          {isHrInterview && <aside className="star-coach"><span className="star-coach-icon" aria-hidden="true">✦</span><span><strong>Structure your story with STAR</strong><small><b>S</b>ituation <i>·</i> <b>T</b>ask <i>·</i> <b>A</b>ction <i>·</i> <b>R</b>esult</small></span></aside>}
          {!isDsaInterview && <label htmlFor="answer">Your response</label>}
          {isHrInterview && voiceMode && <div className="voice-input-row">
            <button className={`mic-button${listening ? " is-listening" : ""}`} type="button" onClick={toggleListening} disabled={submitting || transcribing || Boolean(feedback)} aria-pressed={listening}>{listening ? "■ Stop & transcribe" : transcribing ? "Transcribing…" : "🎙 Start speaking"}</button>
            {voiceNotice && <span role="status">{voiceNotice}</span>}
          </div>}
          {!isDsaInterview && <><textarea id="answer" placeholder="Explain your approach and reasoning…" rows="8" value={answer} onChange={(event) => setAnswer(event.target.value)} disabled={submitting} />
          {error && <p className="error-message" role="alert">{error}</p>}
          <button type="submit" disabled={!answer.trim() || submitting}>{submitting ? "Evaluating…" : "Submit answer"}</button></>}
        </form>
      ) : (
        <section className="feedback-card" aria-live="polite">
          {isHrInterview && voiceMode && <p className="voice-feedback-note">🔊 Your score and a feedback tip are being read aloud.</p>}
          <h2>AI feedback · {feedback.score}/10</h2>
          {isDsaInterview ? <details className="dsa-submitted-solution"><summary>View submitted solution</summary><p><strong>{feedback.language} solution</strong></p><pre>{feedback.code}</pre><p><strong>Approach:</strong> {feedback.reasoning}</p><p><strong>Complexity:</strong> time {feedback.timeComplexity || "not provided"} · space {feedback.spaceComplexity || "not provided"}</p></details> : <p><strong>Your answer:</strong> {feedback.answer}</p>}
          <p><strong>Suggested answer:</strong> {feedback.correctAnswer}</p>
          <p><strong>Recommended next level:</strong> {feedback.recommendedDifficulty || "Medium"}</p>
          {feedback.followUpQuestions?.length > 0 && <div><h3>Follow-up questions</h3><ul>{feedback.followUpQuestions.map((item, index) => <li key={`follow-up-${index}`}>{item}</li>)}</ul></div>}
          {[["Strengths", feedback.strengths], ["Areas to improve", feedback.weaknesses], ["Suggestions", feedback.suggestions]].map(([heading, items]) => items.length > 0 && <div key={heading}><h3>{heading}</h3><ul>{items.map((item, index) => <li key={`${heading}-${index}`}>{item}</li>)}</ul></div>)}
          {feedback.previousAttempt && <div className="revision-result"><span>ANSWER REVISION</span><strong>{feedback.previousAttempt.score}/10 <i>→</i> {feedback.score}/10</strong><small>{feedback.score > feedback.previousAttempt.score ? `+${feedback.score - feedback.previousAttempt.score} points after your revision` : "Your revised answer is saved. Keep practicing to build fluency."}</small></div>}
          {revisionMode ? <form className="revision-form" onSubmit={handleRevision}>
            {isDsaInterview ? <DsaWorkspace question={question} language={language} onLanguageChange={changeDsaLanguage} code={code} onCodeChange={changeDsaCode} reasoning={reasoning} onReasoningChange={setReasoning} timeComplexity={timeComplexity} onTimeComplexityChange={setTimeComplexity} spaceComplexity={spaceComplexity} onSpaceComplexityChange={setSpaceComplexity} submitting={submitting} error={error} submitLabel="Re-evaluate solution" runTestsAvailable={Boolean(question.id) && hasCodeRunnerSupport(question)} runPending={runPending} runResult={runResult} runError={runError} onRunTests={handleRunTests} /> : <><label htmlFor="revision-answer">Rewrite your answer using the feedback</label>
            <textarea id="revision-answer" rows="6" value={revisionAnswer} onChange={(event) => setRevisionAnswer(event.target.value)} disabled={submitting} /></>}
            {error && !isDsaInterview && <p className="error-message" role="alert">{error}</p>}
            {!isDsaInterview && <div className="session-actions"><button type="submit" disabled={!revisionAnswer.trim() || submitting}>{submitting ? "Re-evaluating…" : "Evaluate revised answer"}</button><button className="secondary-button" type="button" disabled={submitting} onClick={() => { setRevisionMode(false); setError(""); }}>Cancel</button></div>}
            {isDsaInterview && <button className="secondary-button dsa-cancel-revision" type="button" disabled={submitting} onClick={() => { setRevisionMode(false); setError(""); }}>Cancel revision</button>}
          </form> : <div className="session-actions">
            {!feedback.previousAttempt && <button className="secondary-button" onClick={() => { setRevisionAnswer(feedback.answer); if (isDsaInterview) { setCode(feedback.code || code); setLanguage(feedback.language || language); setReasoning(feedback.reasoning || ""); setTimeComplexity(feedback.timeComplexity || ""); setSpaceComplexity(feedback.spaceComplexity || ""); } setRevisionMode(true); }}>Improve my answer</button>}
            <button onClick={continueInterview}>{currentQuestion + 1 === questions.length ? "View results" : "Next question →"}</button>
          </div>}
        </section>
      )}
      <p className="score-so-far">{answers.length ? `Score so far: ${totalScore} / ${answers.length * 10}` : "Your score and coaching will appear here after your first answer."}</p>
    </main></>
  );
}

export default InterviewSession;
