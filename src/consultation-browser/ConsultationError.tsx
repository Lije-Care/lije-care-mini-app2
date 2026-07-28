import type { ConsultationErrorCode } from "./state";

const messages: Record<ConsultationErrorCode, string> = {
  HANDOFF_MALFORMED: "This consultation link is not valid.",
  HANDOFF_INVALID_OR_USED:
    "This consultation link has expired or has already been used.",
  CONSULTATION_ENDED: "This consultation has ended.",
  SESSION_INVALID:
    "Your consultation session has expired. Return to Telegram for a new link.",
  BROWSER_UNSUPPORTED:
    "Use a current version of Chrome or Safari to join this consultation.",
  MEDIA_PERMISSION_DENIED:
    "Camera or microphone access was denied. Allow access in browser settings and try again.",
  MEDIA_DEVICE_MISSING:
    "A required camera or microphone was not found.",
  JOIN_FAILED:
    "The consultation could not connect. Check your connection and try again.",
  UNKNOWN:
    "The consultation could not be loaded. Return to Telegram and try again.",
};

export const ConsultationError = ({
  code,
}: {
  code: ConsultationErrorCode;
}) => (
  <main className="consultation-card consultation-error" role="alert">
    <div className="consultation-mark">!</div>
    <h1>Unable to open consultation</h1>
    <p>{messages[code]}</p>
  </main>
);
