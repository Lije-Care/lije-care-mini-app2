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
  telegramInitData: string | null;
}

type TelegramAuthErrorPayload = {
  message?: string;
  code?: string;
};

type TelegramLaunchContext = {
  rawInitData: string | null;
  webAppInitData: string | null;
  sdkInitDataRaw: string | null;
  user: TelegramUser | null;
};

type TelegramSdkUser = {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
};

type TelegramWebAppUser = {
  id?: number | string;
  first_name?: string;
  last_name?: string;
  username?: string;
};

const mapSdkUser = (user?: TelegramSdkUser | null): TelegramUser | null => {
  if (!user?.id) return null;

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
  };
};

const mapWebAppUser = (user?: TelegramWebAppUser | null): TelegramUser | null => {
  if (typeof user?.id !== "number" && typeof user?.id !== "string") {
    return null;
  }

  const normalizedId = Number(user.id);
  if (!Number.isFinite(normalizedId)) {
    return null;
  }

  return {
    id: normalizedId,
    firstName: user.first_name || "",
    lastName: user.last_name,
    username: user.username,
  };
};

const readTelegramLaunchContext = (): TelegramLaunchContext => {
  let rawInitData: string | null = null;
  let webAppInitData: string | null = null;
  let sdkInitDataRaw: string | null = null;
  let user: TelegramUser | null = null;
  const webApp = (window as { Telegram?: { WebApp?: any } }).Telegram?.WebApp;

  if (typeof webApp?.initData === "string") {
    const trimmedInitData = webApp.initData.trim();
    webAppInitData = trimmedInitData ? trimmedInitData : null;
    rawInitData = webAppInitData;
  }

  try {
    const launchParams = retrieveLaunchParams();
    sdkInitDataRaw = launchParams.initDataRaw ?? null;
    if (!rawInitData) {
      rawInitData = sdkInitDataRaw;
    }
    user = mapSdkUser(launchParams.initData?.user);
  } catch {
    // Fall back to Telegram WebApp globals below.
  }

  if (!user) {
    user = mapWebAppUser(webApp?.initDataUnsafe?.user);
  }

  return { rawInitData, webAppInitData, sdkInitDataRaw, user };
};

const isNotRegisteredError = (
  error: AxiosError<TelegramAuthErrorPayload>
): boolean =>
  error?.response?.status === 404 ||
  error?.response?.data?.message === "User not found" ||
  error?.response?.data?.code === "TELEGRAM_USER_NOT_REGISTERED";

const useTelegramAuth = (onAuthChange?: () => void): UseTelegramAuthResult => {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [telegramInitData, setTelegramInitData] = useState<string | null>(null);

  useEffect(() => {
    const authenticate = async () => {
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
          if (data.refresh_token) {
            localStorage.setItem("refresh_token", data.refresh_token);
          } else {
            localStorage.removeItem("refresh_token");
          }
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
          const err = error as AxiosError<TelegramAuthErrorPayload>;
          if (isNotRegisteredError(err)) {
            setStatus("not_registered");
          } else {
            setStatus("error");
          }
        }
        return;
      }

      const { rawInitData, webAppInitData, sdkInitDataRaw, user } =
        readTelegramLaunchContext();
      setTelegramInitData(rawInitData);

      if (!user?.id || !rawInitData) {
        setStatus("error");
        return;
      }

      setTelegramUser(user);

      try {
        const { data } = await api.post("/auth/telegram/session", {
          initData: rawInitData,
          webAppInitData,
          sdkInitDataRaw,
        });

        localStorage.setItem("access_token", data.access_token);
        if (data.refresh_token) {
          localStorage.setItem("refresh_token", data.refresh_token);
        } else {
          localStorage.removeItem("refresh_token");
        }
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
        const err = error as AxiosError<TelegramAuthErrorPayload>;
        if (isNotRegisteredError(err)) {
          setStatus("not_registered");
        } else {
          setStatus("error");
        }
      }
    };

    authenticate();
  }, []);

  return { status, telegramUser, telegramInitData };
};

export default useTelegramAuth;
