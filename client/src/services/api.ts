import axios from 'axios';

// Si existe la variable de entorno en producción usamos Render, sino el proxy local
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vb_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vb_token');
      localStorage.removeItem('vb_user');
      window.dispatchEvent(new Event('auth-changed'));
    }
    return Promise.reject(error);
  }
);

export default api;
