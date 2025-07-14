"use client";
import { createContext, useContext, useState, useEffect } from "react";
import {jwtDecode} from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      return jwtDecode(token);
    } catch {
      return null;
    }
  });

  // ✅ Login function (used after signup or login)
  const login = (token) => {
    try {
      const decoded = jwtDecode(token);
      localStorage.setItem("token", token);
      setToken(token);
      setUser({ email: decoded.email });
    } catch (err) {
      console.error("❌ Invalid token during login:", err.message);
    }
  };

  // ✅ Logout function
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
