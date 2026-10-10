import { API } from "./client";

export const evaluateAnswer = async (question, answer) => {
  const response = await API.post("/ai/evaluate", {
    question,
    answer,
  });

  return response.data;
};

export const reviewResume = async (resumeText) => {
  const formData = new FormData();
  formData.append("file", resumeText);
  const response = await API.post("/ai/review-resume", formData);
  return response.data;
};

export const transcribeAudio = async (audioBlob, filename) => {
  const formData = new FormData();
  formData.append("file", audioBlob, filename);
  const response = await API.post("/ai/transcribe", formData);
  return response.data;
};
