const STORAGE_KEY = "intervuai.coach.v1";

function storageKey(userId) { return `${STORAGE_KEY}.${userId || "guest"}`; }

function emptyProfile() {
  return { sessionCount: 0, skills: {} };
}

export function getCoachProfile(userId) {
  try {
    const profile = JSON.parse(window.localStorage.getItem(storageKey(userId)) || "null");
    if (profile && profile.skills && typeof profile.skills === "object") {
      // Older versions copied complete answers into localStorage. Keep only aggregate scores here;
      // the signed-in user's detailed history is already stored on the server.
      const migrated = { sessionCount: Math.max(0, Number(profile.sessionCount) || profile.sessions?.length || 0), skills: profile.skills };
      if (profile.sessions || profile.sessionCount !== migrated.sessionCount || Object.keys(profile).length !== 2) {
        window.localStorage.setItem(storageKey(userId), JSON.stringify(migrated));
      }
      return migrated;
    }
  } catch {
    // Use a clean profile if browser storage is unavailable or malformed.
  }
  return emptyProfile();
}

export function recordInterview({ interviewType, answers, userId }) {
  const profile = getCoachProfile(userId);
  const normalizedAnswers = answers.map((answer) => ({
    ...answer,
    topic: answer.topic?.trim() || interviewType.replace(/ Interview$/i, ""),
    score: Math.max(0, Math.min(10, Number(answer.score) || 0)),
  }));

  normalizedAnswers.forEach(({ topic, score }) => {
    const previous = profile.skills[topic] || { attempts: 0, totalScore: 0, average: 0 };
    const attempts = previous.attempts + 1;
    const totalScore = previous.totalScore + score;
    profile.skills[topic] = { attempts, totalScore, average: Math.round((totalScore / attempts) * 10) / 10 };
  });

  const session = {
    id: `${Date.now()}`,
    interviewType,
    date: new Date().toISOString(),
    score: normalizedAnswers.reduce((sum, answer) => sum + answer.score, 0),
    maxScore: normalizedAnswers.length * 10,
    answers: normalizedAnswers,
  };
  profile.sessionCount += 1;

  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(profile));
  } catch {
    // The current session still works if the browser blocks persistent storage.
  }
  return { profile, session };
}

export function chooseAdaptiveQuestions(questions, count = 5, userId, skillScores = {}) {
  if (questions.length <= count) return questions;
  const profile = getCoachProfile(userId);
  const knownSkills = [...new Set([...Object.keys(profile.skills), ...Object.keys(skillScores)])];
  const candidates = [...questions];

  if (knownSkills.length === 0) {
    return shuffle(candidates).slice(0, count);
  }

  const skillScore = (question) => {
    const topic = question.topic?.trim();
    return topic ? (skillScores[topic] ?? profile.skills[topic]?.average ?? 6.5) : 6.5;
  };
  const difficultyDistance = (question) => {
    const rank = difficultyRank(question.difficulty);
    const score = skillScore(question);
    const target = score < 5 ? 0 : score < 8 ? 1 : 2;
    return rank < 0 ? 1 : Math.abs(rank - target);
  };

  // Lower scores come first, with a small random tie-break so runs feel fresh.
  candidates.sort((left, right) => skillScore(left) - skillScore(right)
    || difficultyDistance(left) - difficultyDistance(right) || Math.random() - 0.5);
  const selected = [];
  const selectedTopics = new Set();
  for (const question of candidates) {
    const topic = question.topic?.trim() || question.title;
    if (!selectedTopics.has(topic)) {
      selected.push(question);
      selectedTopics.add(topic);
    }
    if (selected.length === count) break;
  }
  if (selected.length < count) {
    const selectedIds = new Set(selected.map((question) => question.id ?? question.title));
    const remaining = shuffle(candidates.filter((question) => !selectedIds.has(question.id ?? question.title)));
    selected.push(...remaining.slice(0, count - selected.length));
  }
  return selected;
}

export function chooseHrQuestions(questions, userId, skillScores = {}) {
  const followupSections = [
    "Motivation & Fit",
    "Strengths & Growth",
    "Teamwork & Collaboration",
    "Adaptability & Problem Solving",
    "Communication & Service",
    "Work Style & Values",
  ];
  const profile = getCoachProfile(userId);
  followupSections.sort((left, right) => {
    const leftScore = skillScores[left] ?? profile.skills[left]?.average ?? 6.5;
    const rightScore = skillScores[right] ?? profile.skills[right]?.average ?? 6.5;
    return leftScore - rightScore || Math.random() - 0.5;
  });
  const sectionOrder = ["Introduction", ...followupSections];
  const selected = sectionOrder.flatMap((topic) => {
    const sectionQuestions = questions.filter((question) => question.topic?.trim() === topic);
    if (!sectionQuestions.length) return [];
    const score = skillScores[topic] ?? profile.skills[topic]?.average ?? 6.5;
    const target = score < 5 ? 0 : score < 8 ? 1 : 2;
    sectionQuestions.sort((left, right) => difficultyDistance(left.difficulty, target) - difficultyDistance(right.difficulty, target));
    const closest = difficultyDistance(sectionQuestions[0].difficulty, target);
    return [shuffle(sectionQuestions.filter((question) => difficultyDistance(question.difficulty, target) === closest))[0]];
  });
  return selected.length >= 5 ? selected : chooseAdaptiveQuestions(questions, Math.min(7, questions.length), userId, skillScores);
}

export function getSkillLevel(average) {
  if (average >= 8.5) return "Interview ready";
  if (average >= 7.5) return "Strong";
  if (average >= 6) return "Building";
  return "Needs practice";
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function difficultyRank(difficulty) {
  const normalized = difficulty?.trim().toLowerCase();
  if (normalized === "easy" || normalized === "beginner") return 0;
  if (normalized === "medium" || normalized === "intermediate") return 1;
  if (normalized === "hard" || normalized === "advanced") return 2;
  return -1;
}

function difficultyDistance(difficulty, target) {
  const rank = difficultyRank(difficulty);
  return rank < 0 ? 1 : Math.abs(rank - target);
}
