import axios from 'axios';

export const apiClient = axios.create({
  // The base URL will be /api and the vite proxy will route it to localhost:3000
  // In production, the backend and frontend might be served from the same domain
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Unauthenticated - might want to trigger a logout action here eventually
      console.warn("API returned 401 Unauthorized");
    }
    return Promise.reject(error);
  }
);
