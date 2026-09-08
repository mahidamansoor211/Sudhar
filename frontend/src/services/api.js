import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sudhar_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem('sudhar_token');
      const onAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';
      if (token && !onAuthPage) {
        localStorage.removeItem('sudhar_token');
        localStorage.removeItem('sudhar_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  return error?.response?.data?.message || error?.message || fallback;
};

export default api;