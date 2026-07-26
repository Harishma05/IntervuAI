import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080/api",
});

// GET Questions
export const getQuestions = async (interviewType) => {
  const response = await API.get(`/questions/${interviewType}`);
  return response.data;
};

// POST Answer
export const saveAnswer = async (answerData) => {
  const response = await API.post("/answers", answerData);
  return response.data;
};