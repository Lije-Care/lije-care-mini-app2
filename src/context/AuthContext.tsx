import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface AuthContextType {
  isFullyOnboarded: boolean;
  refreshAuth: () => void;
}

function readIsFullyOnboarded(): boolean {
  return (
    !!localStorage.getItem("access_token") &&
    (localStorage.getItem("onboarding_completed") === "true" ||
      localStorage.getItem("has_children") === "true")
  );
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isFullyOnboarded, setIsFullyOnboarded] = useState(readIsFullyOnboarded);

  const refreshAuth = useCallback(() => {
    setIsFullyOnboarded(readIsFullyOnboarded());
  }, []);

  return (
    <AuthContext.Provider value={{ isFullyOnboarded, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
