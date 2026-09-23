import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1";

// In docker VITE_API_BASE_URL is "/api/v1" (relative, nginx-proxied); in local dev it's
// absolute ("http://localhost:8090/api/v1"). Endpoints that hand back a server-rooted
// path (e.g. the attachment preview signed URL, which already starts with "/api/v1/...")
// need just the origin here, not API_BASE_URL itself — concatenating the two would
// double up "/api/v1".
export const API_ORIGIN = API_BASE_URL.startsWith("http") ? new URL(API_BASE_URL).origin : window.location.origin;

const ACCESS_TOKEN_KEY = "crms.accessToken";
const REFRESH_TOKEN_KEY = "crms.refreshToken";

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: ApiFieldError[];
}

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const body = error.response?.data;
    if (body?.fieldErrors?.length) {
      return body.fieldErrors.map((fe) => fe.message).join(", ");
    }
    if (body?.message) {
      return body.message;
    }
  }
  return "Đã có lỗi xảy ra, vui lòng thử lại";
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      tokenStorage.clear();
      if (!window.location.pathname.startsWith("/admin/login")) {
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  },
);
