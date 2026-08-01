import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  selectIsConnectedToRoom,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  selectPeers,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";
import {
  loadConsultationSession,
  requestConsultationCredential,
  ConsultationApiError,
} from "./api";
import { safeLifecycleReducer, type LifecycleEvent } from "./lifecycle";
import type { ConsultationErrorCode, ConsultationSession } from "./state";
import { consultationTelemetry } from "./telemetry";

const terminalCodes = new Set([
  "SESSION_INVALID",
  "CONSULTATION_ENDED",
  "BROWSER_UNSUPPORTED",
]);

const publicError = (error: unknown): ConsultationErrorCode => {
  if (error instanceof ConsultationApiError) {
    return terminalCodes.has(error.code)
      ? (error.code as ConsultationErrorCode)
      : "UNKNOWN";
  }
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "MEDIA_PERMISSION_DENIED";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "MEDIA_DEVICE_MISSING";
  }
  return "JOIN_FAILED";
};

export const useConsultationLifecycle = () => {
  const hmsActions = useHMSActions();
  const connected = useHMSStore(selectIsConnectedToRoom);
  const audioEnabled = useHMSStore(selectIsLocalAudioEnabled);
  const videoEnabled = useHMSStore(selectIsLocalVideoEnabled);
  const peers = useHMSStore(selectPeers);
  const [state, dispatchUnsafe] = useReducer(safeLifecycleReducer, "IDLE");
  const [session, setSession] = useState<ConsultationSession | null>(null);
  const [errorCode, setErrorCode] = useState<ConsultationErrorCode>("UNKNOWN");
  const stateRef = useRef(state);
  const mountedRef = useRef(true);
  const joinLockRef = useRef(false);
  const validationLockRef = useRef(false);
  const leavePromiseRef = useRef<Promise<void> | null>(null);
  const connectedOnceRef = useRef(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const tabIdRef = useRef(
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
  );

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const dispatch = useCallback((event: LifecycleEvent) => {
    try {
      dispatchUnsafe(event);
      consultationTelemetry("lifecycle_transition", {
        from: stateRef.current,
        trigger: event,
      });
    } catch {
      consultationTelemetry("invalid_transition_rejected", {
        from: stateRef.current,
        trigger: event,
      });
    }
  }, []);

  const fail = useCallback(
    (error: unknown) => {
      const code = publicError(error);
      const terminal = terminalCodes.has(code);
      setErrorCode(code);
      dispatch(terminal ? "FAIL_TERMINAL" : "FAIL_RECOVERABLE");
      consultationTelemetry("consultation_error", { code, terminal });
    },
    [dispatch],
  );

  const validate = useCallback(async () => {
    if (validationLockRef.current) return;
    validationLockRef.current = true;
    const current = stateRef.current;
    dispatch(current === "IDLE" || current === "READY" ? "VALIDATE" : "RETRY");
    try {
      const next = await loadConsultationSession();
      if (new Date(next.endsAt).getTime() <= Date.now() || next.appointmentState === "ENDED") {
        throw new ConsultationApiError("CONSULTATION_ENDED", "Consultation ended");
      }
      if (!mountedRef.current) return;
      setSession(next);
      dispatch("VALID");
      consultationTelemetry("session_validated", {
        consultationType: next.consultationType,
        participantRole: next.participantRole,
      });
    } catch (error) {
      if (mountedRef.current) fail(error);
    } finally {
      validationLockRef.current = false;
    }
  }, [dispatch, fail]);

  const leave = useCallback(
    (reason = "user") => {
      if (leavePromiseRef.current) return leavePromiseRef.current;
      const current = stateRef.current;
      if (current === "DISCONNECTED" || current === "IDLE") {
        return Promise.resolve();
      }
      dispatch("LEAVE");
      joinLockRef.current = true;
      const operation = Promise.resolve(hmsActions.leave())
        .catch(() => undefined)
        .then(() => {
          connectedOnceRef.current = false;
          if (mountedRef.current) dispatch("LEFT");
          consultationTelemetry("leave_completed", { reason });
        })
        .finally(() => {
          leavePromiseRef.current = null;
        });
      leavePromiseRef.current = operation;
      return operation;
    },
    [dispatch, hmsActions],
  );

  const join = useCallback(async () => {
    if (joinLockRef.current || stateRef.current !== "READY" || !session) return;
    joinLockRef.current = true;
    dispatch("JOIN");
    channelRef.current?.postMessage({ type: "JOIN_INTENT", tabId: tabIdRef.current });
    consultationTelemetry("join_started", {
      consultationType: session.consultationType,
      participantRole: session.participantRole,
    });
    try {
      const latest = await loadConsultationSession();
      if (latest.appointmentState !== "ACTIVE" || new Date(latest.endsAt).getTime() <= Date.now()) {
        throw new ConsultationApiError(
          latest.appointmentState === "ENDED" ? "CONSULTATION_ENDED" : "SESSION_INVALID",
          "Consultation unavailable",
        );
      }
      const credential = await requestConsultationCredential();
      if (new Date(credential.expiresAt).getTime() <= Date.now()) {
        throw new ConsultationApiError("SESSION_INVALID", "Credential expired");
      }
      await hmsActions.join({
        userName: latest.displayName,
        authToken: credential.authToken,
        settings: {
          isAudioMuted: false,
          isVideoMuted: latest.consultationType !== "VIDEO",
        },
      });
      connectedOnceRef.current = true;
      dispatch("JOINED");
      channelRef.current?.postMessage({ type: "CONNECTED", tabId: tabIdRef.current });
      consultationTelemetry("join_succeeded");
    } catch (error) {
      joinLockRef.current = false;
      consultationTelemetry("join_failed", { code: publicError(error) });
      fail(error);
    }
  }, [dispatch, fail, hmsActions, session]);

  const retry = useCallback(() => {
    joinLockRef.current = false;
    void validate();
  }, [validate]);

  useEffect(() => {
    void validate();
  }, [validate]);

  useEffect(() => {
    if (connected && stateRef.current === "RECONNECTING") {
      dispatch("RECONNECTED");
      consultationTelemetry("reconnect_succeeded");
    }
    if (!connected && connectedOnceRef.current && stateRef.current === "CONNECTED") {
      dispatch("CONNECTION_LOST");
      consultationTelemetry("reconnect_started");
    }
  }, [connected, dispatch]);

  useEffect(() => {
    if (session?.consultationType === "AUDIO" && videoEnabled) {
      void hmsActions.setLocalVideoEnabled(false);
    }
  }, [hmsActions, session?.consultationType, videoEnabled]);

  useEffect(() => {
    if (!session) return;
    const remaining = new Date(session.endsAt).getTime() - Date.now();
    if (remaining <= 0) {
      void leave("appointment_expired").then(() => {
        setErrorCode("CONSULTATION_ENDED");
        consultationTelemetry("appointment_ended");
        dispatch("FAIL_TERMINAL");
      });
      return;
    }
    const expiryTimer = window.setTimeout(() => {
      void leave("appointment_expired").then(() => {
        setErrorCode("CONSULTATION_ENDED");
        consultationTelemetry("appointment_ended");
        dispatch("FAIL_TERMINAL");
      });
    }, remaining);
    const revalidationTimer = window.setInterval(() => {
      if (stateRef.current === "READY") void validate();
    }, 30_000);
    return () => {
      window.clearTimeout(expiryTimer);
      window.clearInterval(revalidationTimer);
    };
  }, [dispatch, leave, session, validate]);

  useEffect(() => {
    if (!session || typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(`lije-consultation-${session.bookingId}`);
    channelRef.current = channel;
    channel.onmessage = (event) => {
      if (
        typeof event.data?.tabId === "string" &&
        event.data.tabId < tabIdRef.current &&
        (event.data?.type === "JOIN_INTENT" || event.data?.type === "CONNECTED") &&
        ["JOINING", "CONNECTED", "RECONNECTING"].includes(stateRef.current)
      ) {
        void leave("another_tab");
      }
    };
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [leave, session]);

  useEffect(() => {
    mountedRef.current = true;
    const exit = () => void leave("page_exit");
    const visible = () => {
      if (document.visibilityState === "visible" && stateRef.current === "READY") {
        void validate();
      }
    };
    window.addEventListener("pagehide", exit);
    window.addEventListener("beforeunload", exit);
    window.addEventListener("popstate", exit);
    document.addEventListener("visibilitychange", visible);
    return () => {
      mountedRef.current = false;
      window.removeEventListener("pagehide", exit);
      window.removeEventListener("beforeunload", exit);
      window.removeEventListener("popstate", exit);
      document.removeEventListener("visibilitychange", visible);
      void leave("unmount");
    };
  }, [leave, validate]);

  return {
    state,
    session,
    errorCode,
    peers,
    audioEnabled,
    videoEnabled,
    join,
    leave,
    retry,
    toggleAudio: () => hmsActions.setLocalAudioEnabled(!audioEnabled),
    toggleVideo: () =>
      session?.consultationType === "VIDEO"
        ? hmsActions.setLocalVideoEnabled(!videoEnabled)
        : Promise.resolve(),
  };
};
