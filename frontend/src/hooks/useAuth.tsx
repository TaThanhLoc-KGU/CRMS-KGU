import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { login as loginRequest, type LoginRequest } from "../api/auth";
import { tokenStorage } from "../api/client";

interface AuthUser {
  username: string;
  fullName: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (request: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_KEY = "crms.user";

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null && tokenStorage.getAccessToken() !== null,
      login: async (request) => {
        const response = await loginRequest(request);
        tokenStorage.setTokens(response.accessToken, response.refreshToken);
        const nextUser: AuthUser = {
          username: response.username,
          fullName: response.fullName,
          role: response.role,
        };
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
        setUser(nextUser);
      },
      logout: () => {
        tokenStorage.clear();
        localStorage.removeItem(USER_KEY);
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
