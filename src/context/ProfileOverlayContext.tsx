import { createContext, useContext, useState, type ReactNode } from "react";

interface ProfileOverlayContextType {
  isProfileOpen: boolean;
  openProfile: () => void;
  closeProfile: () => void;
}

const ProfileOverlayContext = createContext<ProfileOverlayContextType | null>(null);

export function ProfileOverlayProvider({ children }: { children: ReactNode }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <ProfileOverlayContext.Provider
      value={{
        isProfileOpen,
        openProfile: () => setIsProfileOpen(true),
        closeProfile: () => setIsProfileOpen(false),
      }}
    >
      {children}
    </ProfileOverlayContext.Provider>
  );
}

export function useProfileOverlay() {
  const ctx = useContext(ProfileOverlayContext);
  if (!ctx) throw new Error("useProfileOverlay must be used within ProfileOverlayProvider");
  return ctx;
}
