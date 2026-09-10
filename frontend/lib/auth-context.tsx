"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api, setToken, LawyerUser, AuthResponse } from "./api";

interface AuthContextValue {
  user: LawyerUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: Record<string, string>) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LawyerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("daksha_user");
    const token = localStorage.getItem("daksha_token");
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  function persist(auth: AuthResponse) {
    setToken(auth.token);
    localStorage.setItem("daksha_user", JSON.stringify(auth.user));
    setUser(auth.user);
  }

  async function login(username: string, password: string) {
    const auth = await api.post<AuthResponse>("/accounts/login/", {
      username,
      password,
    });
    persist(auth);
  }

  async function register(data: Record<string, string>) {
    const auth = await api.post<AuthResponse>("/accounts/register/", data);
    persist(auth);
  }

  function logout() {
    setToken(null);
    localStorage.removeItem("daksha_user");
    setUser(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
