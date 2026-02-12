"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id?: string;
  email: string;
  role: string;
  full_name?: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, role: string, email: string, full_name?: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const t = localStorage.getItem("token");
    const r = localStorage.getItem("role");
    const e = localStorage.getItem("email");
    const n = localStorage.getItem("full_name");
    if (t && r && e) {
      setToken(t);
      setUser({ email: e, role: r, full_name: n || undefined });
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, role: string, email: string, full_name?: string) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("role", role);
    localStorage.setItem("email", email);
    if (full_name) localStorage.setItem("full_name", full_name);
    setToken(newToken);
    setUser({ email, role, full_name });

    switch (role) {
      case "admin": router.push("/admin"); break;
      case "faculty": router.push("/faculty"); break;
      case "student": router.push("/student"); break;
      case "deo": router.push("/deo"); break;
      default: router.push("/dashboard"); break;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("full_name");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
