import axios from "axios";

import {
  getToken,
  removeToken,
} from "../utils/token";

export const createApiClient = (
  baseURL
) => {
  const apiClient = axios.create({
    baseURL,
    headers: {
      "Content-Type":
        "application/json",
    },
    timeout: 10000,
  });

  apiClient.interceptors.request.use(
    (config) => {
      const token = getToken();

      if (token) {
        config.headers.Authorization =
          `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (
        error.response?.status === 401
      ) {
        removeToken();

        if (
          window.location.pathname !==
          "/login"
        ) {
          window.location.href = "/login";
        }
      }

      return Promise.reject(error);
    }
  );

  return apiClient;
};