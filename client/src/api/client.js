import axios from 'axios';
import logger from '../utils/logger';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    logger.error('api_error', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      requestId: error.response?.data?.requestId,
      message: error.response?.data?.message || error.message,
    });

    const message =
      error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export const questionsApi = {
  getRandom: () => api.get('/questions/random'),
  getDaily: () => api.get('/questions/daily'),
  getById: (id) => api.get(`/questions/${id}`),
};

export const assessmentApi = {
  start: (questionId, mode) => api.post('/assessment/start', { questionId, mode }),
  run: (sessionId, sourceCode, language) =>
    api.post('/assessment/run', { sessionId, sourceCode, language }),
  submit: (sessionId, sourceCode, language) =>
    api.post('/assessment/submit', { sessionId, sourceCode, language }),
  getResult: (id) => api.get(`/assessment/result/${id}`),
};

export const monitoringApi = {
  logEvent: (sessionId, eventType, metadata = {}) =>
    api.post('/monitoring/event', { sessionId, eventType, metadata }),
};

export default api;
