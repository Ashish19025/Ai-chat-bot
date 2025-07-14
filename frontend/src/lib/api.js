import axios from "axios";

// Create Axios instance with base URL
const api = axios.create({
  baseURL: "http://localhost:3001/api",
});

// Request interceptor to add token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
