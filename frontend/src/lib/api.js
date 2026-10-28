import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:5000/api/v1" : "");

if (!apiBaseUrl) {
  throw new Error("VITE_API_BASE_URL must be configured for production.");
}

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export function getApiError(error) {
  return error.response?.data?.message || "Something went wrong. Please try again.";
}

export default api;
