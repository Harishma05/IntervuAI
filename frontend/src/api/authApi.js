import { API } from "./client";

export const getCurrentUser = async () => (await API.get("/auth/me")).data;
export const loginAccount = async (credentials) => (await API.post("/auth/login", credentials)).data;
export const registerAccount = async (account) => (await API.post("/auth/register", account)).data;
export const logoutAccount = async () => API.post("/auth/logout");
