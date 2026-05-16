import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User } from "@shared/schema";

interface AuthUser extends Partial<User> {
  isAdmin?: boolean;
  username?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isLoggingIn: boolean;
  refetch: () => Promise<void>;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isLoggingIn: false,
  refetch: async () => {},
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials: { username: string; password: string }) => {
    setIsLoggingIn(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Login gagal");
      }
      await refetch();
    } finally {
      setIsLoggingIn(false);
    }
  }, [refetch]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    setUser(null);
    window.location.href = "/";
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <AuthContext.Provider value={{ user, isLoading, isLoggingIn, refetch, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
