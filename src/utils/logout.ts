const SESSION_STORAGE_KEYS = [
  "access_token",
  "refresh_token",
  "user",
  "has_children",
  "onboarding_completed",
  "onboarding_complete",
  "parent_profile",
  "favorite_child_id",
] as const;

export function clearLocalSession(): void {
  SESSION_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function signOutAndCloseApp(fallback?: () => void): void {
  clearLocalSession();

  try {
    const tgWebApp = (window as any)?.Telegram?.WebApp;
    if (tgWebApp?.close) {
      tgWebApp.close();
      return;
    }
  } catch {
    // Ignore Telegram close errors and continue fallback.
  }

  fallback?.();
}
