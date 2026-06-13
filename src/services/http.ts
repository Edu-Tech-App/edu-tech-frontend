import axios from "axios";

const viteEnv = (import.meta as ImportMeta & { env: { VITE_API_URL?: string } }).env;
const API_URL = viteEnv.VITE_API_URL || "http://localhost:3000";

export const API_URL_PUBLIC = API_URL;

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const authorizedBlobGet = async (
  url: string,
  params?: Record<string, string | number | undefined>,
) => {
  const token = localStorage.getItem("accessToken");
  const response = await axios.get(`${API_URL}${url}`, {
    params,
    responseType: "blob",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data as Blob;
};

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  }
  return fallbackMessage;
};
