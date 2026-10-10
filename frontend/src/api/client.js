import axios from "axios";

// Keep browser API requests on the frontend origin in local development (Vite proxies /api)
// and in production (Spring Boot serves the frontend and API from the same host).
export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";
export const API = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

API.interceptors.request.use(async (config) => {
  if (["post", "put", "patch", "delete"].includes(config.method?.toLowerCase())) {
    const response = await axios.get(`${API_BASE_URL}/auth/csrf`, { withCredentials: true });
    config.headers.set("X-XSRF-TOKEN", response.data.token);
  }
  return config;
});
