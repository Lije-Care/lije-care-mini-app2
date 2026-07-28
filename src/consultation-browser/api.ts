import type { ConsultationSession } from "./state";

const apiBase = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export class ConsultationApiError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
  }
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ConsultationApiError(
      payload?.code || "UNKNOWN",
      payload?.message || "The consultation could not be loaded.",
    );
  }
  return payload as T;
};

export const redeemHandoff = (code: string) =>
  request<{ status: "REDEEMED" }>("/browser-consultations/redeem", {
    method: "POST",
    body: JSON.stringify({ code }),
  });

export const loadConsultationSession = () =>
  request<ConsultationSession>("/browser-consultations/session");

// Phase 3's call controller will invoke this and keep the credential in memory only.
export const requestConsultationCredential = () =>
  request<{ authToken: string; expiresAt: string }>(
    "/browser-consultations/credential",
    { method: "POST" },
  );
