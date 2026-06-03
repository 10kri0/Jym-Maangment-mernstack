import axios from 'axios';

function getApiUrl() {
  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;

    if (import.meta.env.VITE_API_URL) {
      try {
        const configuredUrl = new URL(import.meta.env.VITE_API_URL);
        if (!['localhost', '127.0.0.1', '::1'].includes(configuredUrl.hostname)) {
          return import.meta.env.VITE_API_URL;
        }
      } catch {
        return import.meta.env.VITE_API_URL;
      }
    }

    return `${protocol}//${hostname}:8000/api`;
  }

  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  return 'http://localhost:8000/api';
}

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gym_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('gym_admin_token');
      localStorage.removeItem('gym_admin_name');
      localStorage.removeItem('gym_admin_email');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
