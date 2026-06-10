import { useEffect, useState } from "react";
import { retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { AxiosError } from "axios";
import api from "@/api/axios";

type AuthStatus =
  | "loading"
  | "authenticated"
  | "needs_onboarding"
  | "not_registered"
  | "error";

interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
}

interface UseTelegramAuthResult {
  status: AuthStatus;
  telegramUser: TelegramUser | null;
}

const BROWSER_AUTH_PARAM_KEYS = [
  "browserAuthToken",
  "browserRefreshToken",
  "browserUser",
  "browserHasChildren",
  "browserOnboardingCompleted",
] as const;

const consumeBrowserSessionFromUrl = () => {
  if (typeof window === "undefined") {
    return;
  }

  const currentUrl = new URL(window.location.href);
  const hashValue = currentUrl.hash.startsWith("#")
    ? currentUrl.hash.slice(1)
    : currentUrl.hash;

  if (!hashValue) {
    return;
  }

  const [hashPath, hashSearch = ""] = hashValue.split("?");
  const hashParams = new URLSearchParams(hashSearch);
  const browserAuthToken = hashParams.get("browserAuthToken");

  if (!browserAuthToken) {
    return;
  }

  localStorage.setItem("access_token", browserAuthToken);

  const browserRefreshToken = hashParams.get("browserRefreshToken");
  if (browserRefreshToken) {
    localStorage.setItem("refresh_token", browserRefreshToken);
  }

  const browserUser = hashParams.get("browserUser");
  if (browserUser) {
    localStorage.setItem("user", decodeURIComponent(browserUser));
  }

  const browserHasChildren = hashParams.get("browserHasChildren");
  if (browserHasChildren) {
    localStorage.setItem("has_children", browserHasChildren);
  }

  const browserOnboardingCompleted = hashParams.get(
    "browserOnboardingCompleted",
  );
  if (browserOnboardingCompleted) {
    localStorage.setItem(
      "onboarding_completed",
      browserOnboardingCompleted,
    );
  }

  BROWSER_AUTH_PARAM_KEYS.forEach((key) => hashParams.delete(key));
  const cleanedHashSearch = hashParams.toString();
  currentUrl.hash = cleanedHashSearch
    ? `#${hashPath}?${cleanedHashSearch}`
    : `#${hashPath}`;
  window.history.replaceState(null, "", currentUrl.toString());
};

const useTelegramAuth = (onAuthChange?: () => void): UseTelegramAuthResult => {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    const authenticate = async () => {
      consumeBrowserSessionFromUrl();

      // If already have a token, check if user has children for routing
      const existingToken = localStorage.getItem("access_token");
      if (existingToken) {
        const hasChildren = localStorage.getItem("has_children");
        const onboardingCompleted = localStorage.getItem(
          "onboarding_completed"
        );
        if (hasChildren === "false" && onboardingCompleted !== "true") {
          setStatus("needs_onboarding");
        } else {
          if (hasChildren === "true" && onboardingCompleted !== "true") {
            localStorage.setItem("onboarding_completed", "true");
          }
          onAuthChange?.();
          setStatus("authenticated");
        }
        return;
      }

      // DEV MODE: Auto-login with Telegram ID from .env
      const devTelegramId = import.meta.env.VITE_DEV_TELEGRAM_ID;
      if (import.meta.env.DEV && devTelegramId) {
        const devUser: TelegramUser = {
          id: Number(devTelegramId),
          firstName: "Dev",
          lastName: "User",
        };
        setTelegramUser(devUser);

        try {
          const { data } = await api.post("/auth/telegram-signin", {
            telegramId: devTelegramId,
          });

          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          localStorage.setItem("user", JSON.stringify(data.data));
          localStorage.setItem("has_children", String(data.hasChildren));

          onAuthChange?.();

          if (!data.hasChildren) {
            setStatus("needs_onboarding");
          } else {
            localStorage.setItem("onboarding_completed", "true");
            onAuthChange?.();
            setStatus("authenticated");
          }
        } catch (error) {
          const err = error as AxiosError<{ message: string }>;
          if (
            err?.response?.status === 404 ||
            err?.response?.data?.message === "User not found"
          ) {
            setStatus("not_registered");
          } else {
            setStatus("error");
          }
        }
        return;
      }

      // Get Telegram user from launch params (proven to work, unlike initData signal)
      let tgUser: TelegramUser | null = null;
      try {
        const launchParams = retrieveLaunchParams();
        const user = launchParams.initData?.user;
        if (user) {
          tgUser = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
          };
        }
      } catch {
        setStatus("error");
        return;
      }

      if (!tgUser?.id) {
        setStatus("error");
        return;
      }

      setTelegramUser(tgUser);

      try {
        const { data } = await api.post("/auth/telegram-signin", {
          telegramId: tgUser.id.toString(),
        });

        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        localStorage.setItem("user", JSON.stringify(data.data));
        localStorage.setItem("has_children", String(data.hasChildren));

        onAuthChange?.();

        if (!data.hasChildren) {
          setStatus("needs_onboarding");
        } else {
          localStorage.setItem("onboarding_completed", "true");
          onAuthChange?.();
          setStatus("authenticated");
        }
      } catch (error) {
        const err = error as AxiosError<{ message: string }>;
        if (
          err?.response?.status === 404 ||
          err?.response?.data?.message === "User not found"
        ) {
          setStatus("not_registered");
        } else {
          setStatus("error");
        }
      }
    };

    authenticate();
  }, []);

  return { status, telegramUser };
};

export default useTelegramAuth;
