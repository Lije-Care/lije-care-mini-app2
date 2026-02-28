import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface AuthContextType {
  isFullyOnboarded: boolean;
  refreshAuth: () => void;
}

function readIsFullyOnboarded(): boolean {
  const token = localStorage.getItem("access_token");
  if (!token) return false;

  const hasChildren = localStorage.getItem("has_children");
  const onboardingCompleted = localStorage.getItem("onboarding_completed");

  // Keep this in sync with useTelegramAuth existing-token logic.
  return !(hasChildren === "false" && onboardingCompleted !== "true");
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
