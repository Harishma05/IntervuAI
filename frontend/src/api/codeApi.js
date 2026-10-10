import { API } from "./client";

export const runCode = async (questionId, language, code) => {
  const response = await API.post("/code/run", { questionId, language, code });
  return response.data;
};
