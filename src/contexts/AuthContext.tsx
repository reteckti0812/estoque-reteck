import React, { createContext, useContext, useState, useCallback } from "react";
import { User, mockUsers } from "@/data/mockData";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auto-login admin for dev convenience. To test as operator, logout and login with maria@reteck.com / op123
  const [user, setUser] = useState<User | null>(mockUsers[0]);

  const login = useCallback(async (email: string, password: string) => {
    const found = mockUsers.find((u) => u.email === email && u.password === password && u.active);
    if (found) {
      setUser(found);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => setUser(null), []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === "admin" }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
