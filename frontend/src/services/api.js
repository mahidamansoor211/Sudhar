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

export const issues = {
  create: (formData) =>
    api.post('/issues', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  list: (params) => api.get('/issues', { params }),
  get: (id) => api.get(`/issues/${id}`),
  checkDuplicates: (params) => api.get('/issues/duplicates', { params }),
  upvote: (id) => api.post(`/issues/${id}/upvote`),
  flag: (id) => api.post(`/issues/${id}/flag`),
  confirmResolution: (id, formData) =>
    api.post(`/issues/${id}/confirm-resolution`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  myReports: (params) => api.get('/issues/mine', { params }),
};

export const notifications = {
  list: (params) => api.get('/notifications', { params }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
};

export const staff = {
  queue: (params) => api.get('/staff/issues', { params }),
  stats: () => api.get('/staff/stats'),
  members: () => api.get('/staff/members'),
  changeStatus: (id, data) => api.patch(`/staff/issues/${id}/status`, data),
  assign: (id, data) => api.post(`/staff/issues/${id}/assign`, data),
  setPriority: (id, priority) => api.patch(`/staff/issues/${id}/priority`, { priority }),
  reroute: (id, department) => api.patch(`/staff/issues/${id}/reroute`, { department }),
};

export const admin = {
  stats: () => api.get('/admin/stats'),
  issues: (params) => api.get('/admin/issues', { params }),
  users: (params) => api.get('/admin/users', { params }),
  setUserActive: (id, isActive) =>
    api.patch(`/admin/users/${id}/status`, { isActive }),
  clearSpam: (id) => api.post(`/admin/issues/${id}/clear-spam`),
};

export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  return error?.response?.data?.message || error?.message || fallback;
};

// Resolves backend-hosted image paths (e.g. "/uploads/x.jpg") to absolute URLs.
const ASSET_BASE = API_BASE_URL.replace(/\/api$/, '');
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${ASSET_BASE}${path}`;
};

export default api;