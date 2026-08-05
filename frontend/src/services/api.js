import axios from 'axios';

const defaultHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const FALLBACK_API_ORIGIN = `http://${defaultHost}:8000`;
const rawApiUrl = import.meta.env.VITE_API_ORIGIN || import.meta.env.VITE_API_BASE_URL;
const configuredApiOrigin = rawApiUrl?.replace(/\/$/, '').replace(/\/api$/, '');

export const API_ORIGIN = configuredApiOrigin || FALLBACK_API_ORIGIN;
export const API_BASE_URL = `${API_ORIGIN}/api/`;

export const buildMediaUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path}`;
};

export const buildApiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_ORIGIN}${normalizedPath}`;
};

export const buildWsUrl = (path, query = '') => {
  const rawWsUrl = import.meta.env.VITE_WS_BASE_URL || import.meta.env.VITE_WS_ORIGIN;
  const wsOrigin = rawWsUrl ? rawWsUrl.replace(/\/$/, '') : API_ORIGIN.replace(/^http/i, 'ws');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${wsOrigin}${normalizedPath}${query}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token & Normalize URLs
api.interceptors.request.use(
  (config) => {
    // Normalize URL to prevent duplicate '/api/' prefix when combined with baseURL
    if (config.url) {
      if (config.url.startsWith('/api/')) {
        config.url = config.url.substring(5);
      } else if (config.url.startsWith('api/')) {
        config.url = config.url.substring(4);
      }
    }

    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Auto Token Refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and not already retried
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          // Attempt token refresh
          const response = await axios.post(buildApiUrl('/api/accounts/refresh/'), {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Only clear session and redirect if the server explicitly rejected the token (400, 401, 403)
          if (refreshError.response && [400, 401, 403].includes(refreshError.response.status)) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            window.location.href = '/';
          }
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
