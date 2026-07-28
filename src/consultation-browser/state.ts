export type ConsultationSession = {
  bookingId: string;
  consultationType: "AUDIO" | "VIDEO";
  participantRole: "PARENT" | "SPECIALIST";
  appointmentState: "UPCOMING" | "ACTIVE" | "ENDED";
  startsAt: string;
  endsAt: string;
  displayName: string;
};

export type ConsultationErrorCode =
  | "HANDOFF_MALFORMED"
  | "HANDOFF_INVALID_OR_USED"
  | "CONSULTATION_ENDED"
  | "SESSION_INVALID"
  | "BROWSER_UNSUPPORTED"
  | "MEDIA_PERMISSION_DENIED"
  | "MEDIA_DEVICE_MISSING"
  | "JOIN_FAILED"
  | "UNKNOWN";
