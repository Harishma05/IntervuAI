import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080/api",
});

export const getQuestions = async (interviewType) => {
  const response = await API.get(`/questions/${interviewType}`);
  return response.data;
};
