import axios from 'axios';
import AuthService from '../services/AuthService';
import AuthStore from '../store/AuthStore';
import { notifyError } from '../utils/notification';
import config from '../config/env.config';

const apiClient = axios.create({
  baseURL: config.BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const accessToken = AuthStore.getTokens()?.accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = AuthStore.getTokens()?.refreshToken;

    if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await AuthService.refreshTokens(refreshToken);
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          refreshResponse;

        AuthStore.setTokens(newAccessToken, newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        AuthStore.removeTokens();
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.data?.message && error.response?.data?.message != 'No token provided.' && error.response?.data?.message != 'User not found') {
      console.error('API Error:', error);
      console.error('Details:', error.response.data.details);
      notifyError(`${error.response.data.message}`);
    }

    if (!error.response) {
      console.error('Network Error', error.message);
      notifyError('Network error: server unavailable. Try again later.');
    }

    return Promise.reject(error);
  },
);

export default apiClient;
