import React, { createContext, useContext, useState, useCallback } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("erp_bi_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("erp_bi_token", res.data.token);
      localStorage.setItem("erp_bi_user", JSON.stringify(res.data.user));
      setUser(res.data.user);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("erp_bi_token");
    localStorage.removeItem("erp_bi_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, error, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
