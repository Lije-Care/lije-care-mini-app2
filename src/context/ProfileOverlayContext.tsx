import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface ProfileOverlayContextType {
  isProfileOpen: boolean;
  openProfile: () => void;
  closeProfile: () => void;
}

const ProfileOverlayContext = createContext<ProfileOverlayContextType | null>(null);

export function ProfileOverlayProvider({ children }: { children: ReactNode }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const openProfile = useCallback(() => setIsProfileOpen(true), []);
  const closeProfile = useCallback(() => setIsProfileOpen(false), []);
  const value = useMemo(
    () => ({
      isProfileOpen,
      openProfile,
      closeProfile,
    }),
    [closeProfile, isProfileOpen, openProfile]
  );

  return (
    <ProfileOverlayContext.Provider value={value}>
      {children}
    </ProfileOverlayContext.Provider>
  );
}

export function useProfileOverlay() {
  const ctx = useContext(ProfileOverlayContext);
  if (!ctx) throw new Error("useProfileOverlay must be used within ProfileOverlayProvider");
  return ctx;
}
