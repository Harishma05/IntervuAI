import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080/api",
});

export const evaluateAnswer = async (question, answer) => {
  const response = await API.post("/ai/evaluate", {
    question,
    answer,
  });

  return response.data;
};