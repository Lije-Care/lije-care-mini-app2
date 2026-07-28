export const consultationStates = [
  "IDLE",
  "VALIDATING_SESSION",
  "READY",
  "JOINING",
  "CONNECTED",
  "RECONNECTING",
  "LEAVING",
  "DISCONNECTED",
  "ERROR_RECOVERABLE",
  "ERROR_TERMINAL",
] as const;

export type ConsultationLifecycleState = (typeof consultationStates)[number];

export type LifecycleEvent =
  | "VALIDATE"
  | "VALID"
  | "JOIN"
  | "JOINED"
  | "CONNECTION_LOST"
  | "RECONNECTED"
  | "LEAVE"
  | "LEFT"
  | "RETRY"
  | "FAIL_RECOVERABLE"
  | "FAIL_TERMINAL";

const transitions: Record<
  ConsultationLifecycleState,
  Partial<Record<LifecycleEvent, ConsultationLifecycleState>>
> = {
  IDLE: { VALIDATE: "VALIDATING_SESSION", FAIL_TERMINAL: "ERROR_TERMINAL" },
  VALIDATING_SESSION: {
    VALID: "READY",
    FAIL_RECOVERABLE: "ERROR_RECOVERABLE",
    FAIL_TERMINAL: "ERROR_TERMINAL",
  },
  READY: {
    JOIN: "JOINING",
    LEAVE: "LEAVING",
    VALIDATE: "VALIDATING_SESSION",
    FAIL_RECOVERABLE: "ERROR_RECOVERABLE",
    FAIL_TERMINAL: "ERROR_TERMINAL",
  },
  JOINING: {
    JOINED: "CONNECTED",
    LEAVE: "LEAVING",
    FAIL_RECOVERABLE: "ERROR_RECOVERABLE",
    FAIL_TERMINAL: "ERROR_TERMINAL",
  },
  CONNECTED: {
    CONNECTION_LOST: "RECONNECTING",
    LEAVE: "LEAVING",
    FAIL_TERMINAL: "ERROR_TERMINAL",
  },
  RECONNECTING: {
    RECONNECTED: "CONNECTED",
    LEAVE: "LEAVING",
    FAIL_RECOVERABLE: "ERROR_RECOVERABLE",
    FAIL_TERMINAL: "ERROR_TERMINAL",
  },
  LEAVING: { LEFT: "DISCONNECTED", FAIL_TERMINAL: "ERROR_TERMINAL" },
  DISCONNECTED: { RETRY: "VALIDATING_SESSION", FAIL_TERMINAL: "ERROR_TERMINAL" },
  ERROR_RECOVERABLE: {
    RETRY: "VALIDATING_SESSION",
    LEAVE: "LEAVING",
    FAIL_TERMINAL: "ERROR_TERMINAL",
  },
  ERROR_TERMINAL: { LEAVE: "LEAVING" },
};

export const transitionLifecycle = (
  state: ConsultationLifecycleState,
  event: LifecycleEvent,
): ConsultationLifecycleState => {
  const next = transitions[state][event];
  if (!next) {
    throw new Error(`Invalid consultation lifecycle transition: ${state} -> ${event}`);
  }
  return next;
};

export const lifecycleReducer = (
  state: ConsultationLifecycleState,
  event: LifecycleEvent,
) => transitionLifecycle(state, event);

export const safeLifecycleReducer = (
  state: ConsultationLifecycleState,
  event: LifecycleEvent,
) => {
  try {
    return transitionLifecycle(state, event);
  } catch {
    return state;
  }
};
