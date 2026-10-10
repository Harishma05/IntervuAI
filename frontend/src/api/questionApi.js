import { API } from "./client";

// OLD API (Keep it for now)
export const getQuestions = async (interviewType, { topic, difficulty } = {}) => {
  const response = await API.get(`/question-bank/${encodeURIComponent(interviewType)}`, {
    params: { ...(topic && { topic }), ...(difficulty && { difficulty }) },
  });
  return response.data;
};

// ✅ NEW Random Question API
export const getRandomQuestion = async (interviewType) => {
  const response = await API.get(
    `/question-bank/random/${interviewType}`
  );
  return response.data;
};

// POST Answer
export const saveAnswer = async (answerData) => {
  const response = await API.post("/answers", answerData);
  return response.data;
};

export const getInterviewHistory = async (page = 0, size = 20) =>
  (await API.get("/answers", { params: { page, size } })).data;
export const getInterviewSummary = async () => (await API.get("/answers/summary")).data;
