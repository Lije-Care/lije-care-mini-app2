import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  selectIsConnectedToRoom,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  selectIsPeerAudioEnabled,
  selectIsPeerVideoEnabled,
  selectPeers,
  useHMSActions,
  useHMSStore,
  useVideo,
} from "@100mslive/react-sdk";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { FiPhoneCall } from "react-icons/fi";
import { MdVideoCameraFront } from "react-icons/md";

import api from "@/api/axios";
import { Page } from "@/components/Page";
import { useBookings } from "@/hooks/useBookings";
import { APP_BACK_INTENT_EVENT } from "@/navigation/back";
import type { ConsultationOrder } from "@/types/consultationOrder";
import {
  getBookingSessionWindowState,
  getConsultationSlotRemainingMs,
} from "@/utils/consultationTime";

const getReadableMediaError = (
  error: unknown,
  consultationType: "AUDIO" | "VIDEO" | null,
  t: (key: string) => string,
) => {
  const fallback =
    consultationType === "VIDEO"
      ? t("Camera or microphone access is blocked. Please allow access and try again.")
      : t("Microphone access is blocked. Please allow access and try again.");

  if (!(error instanceof Error)) {
    return fallback;
  }

  const normalized = `${error.name} ${error.message}`.toLowerCase();

  if (
    normalized.includes("notallowederror") ||
    normalized.includes("permission denied") ||
    normalized.includes("permission dismissed") ||
    normalized.includes("denied permission")
  ) {
    return consultationType === "VIDEO"
      ? t("Camera or microphone permission was denied. Please allow both in your browser settings and try again.")
      : t("Microphone permission was denied. Please allow it in your browser settings and try again.");
  }

  if (
    normalized.includes("notfounderror") ||
    normalized.includes("devicesnotfounderror") ||
    normalized.includes("requested device not found")
  ) {
    return consultationType === "VIDEO"
      ? t("No camera or microphone was found on this device.")
      : t("No microphone was found on this device.");
  }

  if (
    normalized.includes("notreadableerror") ||
    normalized.includes("trackstarterror") ||
    normalized.includes("could not start video source")
  ) {
    return consultationType === "VIDEO"
      ? t("Camera or microphone is busy in another app. Close the other app and try again.")
      : t("Microphone is busy in another app. Close the other app and try again.");
  }

  if (
    normalized.includes("overconstrainederror") ||
    normalized.includes("constraint")
  ) {
    return consultationType === "VIDEO"
      ? t("This device could not satisfy the requested camera or microphone settings.")
      : t("This device could not satisfy the requested microphone settings.");
  }

  if (
    normalized.includes("notsupportederror") ||
    normalized.includes("media devices api unavailable")
  ) {
    return t("Your device does not support in-app audio/video permissions.");
  }

  return error.message || fallback;
};

const SessionCallPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { doctorId } = useParams();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const requestedActionType = searchParams.get("actionType") as
    | "AUDIO"
    | "VIDEO"
    | null;

  const { bookings } = useBookings();
  const [consultationOrders, setConsultationOrders] = useState<ConsultationOrder[]>([]);
  const [guestVideoRoomCode, setGuestVideoRoomCode] = useState<string | null>(null);
  const [roomAccessError, setRoomAccessError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(false);
  const [isJoiningCall, setIsJoiningCall] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(null);

  const telegramUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = telegramUser?.id;
  const selectedBooking = bookingId
    ? bookings.find((booking) => booking.id === bookingId)
    : null;
  const selectedOrder = bookingId
    ? consultationOrders.find((order) => order.bookingId === bookingId)
    : null;
  const consultationType = selectedOrder?.consultationType ?? requestedActionType;
  const callConsultationType =
    consultationType === "AUDIO" || consultationType === "VIDEO"
      ? consultationType
      : requestedActionType;
  const slotWindowState = selectedBooking
    ? getBookingSessionWindowState(selectedBooking)
    : "unknown";
  const isConfirmedBooking = selectedOrder?.status === "CONFIRMED";
  const canJoinCall =
    Boolean(selectedBooking) &&
    Boolean(selectedOrder) &&
    selectedBooking?.expertId === doctorId &&
    selectedBooking?.parentId === currentUserId &&
    isConfirmedBooking &&
    (consultationType === "AUDIO" || consultationType === "VIDEO") &&
    slotWindowState === "active";

  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const isAudioOn = useHMSStore(selectIsLocalAudioEnabled);
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);
  const peers = useHMSStore(selectPeers);

  const title = useMemo(() => {
    if (!selectedBooking?.expert) return t("Session Call");
    return `${selectedBooking.expert.firstName ?? ""} ${selectedBooking.expert.lastName ?? ""}`.trim();
  }, [selectedBooking, t]);

  useEffect(() => {
    const handleBackIntent = (e: Event) => {
      e.preventDefault();
      navigate("/consultation", { replace: true });
    };

    window.addEventListener(APP_BACK_INTENT_EVENT, handleBackIntent);
    return () => window.removeEventListener(APP_BACK_INTENT_EVENT, handleBackIntent);
  }, [navigate]);

  useEffect(() => {
    if (!currentUserId) {
      setConsultationOrders([]);
      return;
    }

    api
      .get(`/consultation-order/my-orders/${currentUserId}`)
      .then((res) => setConsultationOrders(res.data ?? []))
      .catch(() => setConsultationOrders([]));
  }, [currentUserId]);

  useEffect(() => {
    if (!telegramUser?.id || !doctorId || !bookingId || !requestedActionType) {
      return;
    }

    setIsLoadingRoom(true);
    setRoomAccessError(null);

    api
      .post("/chat/rooms/find-or-create", {
        parentId: telegramUser.id,
        expertId: doctorId,
        bookingId,
        actionType: requestedActionType,
      })
      .then((res) => {
        setGuestVideoRoomCode(res.data.guestVideoRoomCode);
      })
      .catch((err) => {
        setRoomAccessError(
          err?.response?.data?.message ||
            t("We couldn't verify this consultation session."),
        );
      })
      .finally(() => setIsLoadingRoom(false));
  }, [bookingId, doctorId, requestedActionType, t, telegramUser?.id]);

  useEffect(() => {
    if (!selectedBooking) {
      setCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const remainingMs = getConsultationSlotRemainingMs(
        selectedBooking.slot,
        selectedBooking.consultationTimeZone,
      );

      if (remainingMs <= 0) {
        setCountdown("00:00");
        if (isConnected) {
          void hmsActions.leave();
        }
        return;
      }

      const minutes = Math.max(0, Math.floor(remainingMs / 1000 / 60));
      const seconds = Math.max(0, Math.floor((remainingMs / 1000) % 60));
      setCountdown(
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [hmsActions, isConnected, selectedBooking]);

  useEffect(() => {
    window.onunload = () => {
      if (isConnected) {
        hmsActions.leave();
      }
    };

    return () => {
      window.onunload = null;
    };
  }, [hmsActions, isConnected]);

  useEffect(() => {
    if (!isConnected || !consultationType) return;

    const syncPublishedTracks = async () => {
      try {
        setMediaError(null);
        await hmsActions.setLocalAudioEnabled(true);
        await hmsActions.setLocalVideoEnabled(consultationType === "VIDEO");
      } catch (error) {
        const nextMessage = getReadableMediaError(error, callConsultationType, t);
        setMediaError(nextMessage);
      }
    };

    void syncPublishedTracks();
  }, [callConsultationType, hmsActions, isConnected, t]);

  const ensureMediaSupport = () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      throw new Error(t("Your device does not support in-app audio/video permissions."));
    }
  };

  const joinRoom = async () => {
    if (!canJoinCall || !guestVideoRoomCode) {
      setRoomAccessError(
        roomAccessError ||
          t("This call will open only during the booked consultation window."),
      );
      return;
    }

    try {
      setIsJoiningCall(true);
      setMediaError(null);
      ensureMediaSupport();
      const authToken = await hmsActions.getAuthTokenByRoomCode({
        roomCode: guestVideoRoomCode,
      });
      await hmsActions.join({
        userName: title || "Parent",
        authToken,
      });
    } catch (error) {
      const nextMessage = getReadableMediaError(error, callConsultationType, t);
      setMediaError(nextMessage);
    } finally {
      setIsJoiningCall(false);
    }
  };

  const leaveRoom = async () => {
    await hmsActions.leave();
    navigate("/consultation", { replace: true });
  };

  const toggleAudio = async () => {
    try {
      setMediaError(null);
      await hmsActions.setLocalAudioEnabled(!isAudioOn);
    } catch (error) {
      setMediaError(getReadableMediaError(error, "AUDIO", t));
    }
  };

  const toggleVideo = async () => {
    try {
      setMediaError(null);
      await hmsActions.setLocalVideoEnabled(!isVideoOn);
    } catch (error) {
      setMediaError(getReadableMediaError(error, "VIDEO", t));
    }
  };

  const callStateMessage = !selectedBooking || !selectedOrder
    ? t("We couldn't verify this consultation session.")
    : selectedOrder.status === "PENDING_ADMIN_CONFIRMATION"
      ? t("This consultation is awaiting approval.")
      : selectedOrder.status === "REJECTED"
        ? t("This consultation was rejected.")
        : slotWindowState !== "active"
          ? t("This call will open only during the booked consultation window.")
          : null;

  return (
    <Page back={true}>
      <div className="min-h-[calc(100vh-60px)] bg-slate-950 text-white flex flex-col">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">{title}</h1>
            <p className="text-xs text-slate-300 uppercase tracking-widest">
              {consultationType === "VIDEO" ? t("Video Consultation") : t("Audio Consultation")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-slate-400">
              {t(slotWindowState === "active" ? "Active Now" : slotWindowState === "upcoming" ? "Upcoming" : "Ended")}
            </p>
            {countdown && isConnected ? (
              <p className="text-sm font-bold text-emerald-300">
                {t("Call ends in")} {countdown}
              </p>
            ) : null}
          </div>
        </div>

        {!isConnected ? (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
                {consultationType === "VIDEO" ? (
                  <MdVideoCameraFront className="w-10 h-10 text-emerald-300" />
                ) : (
                  <FiPhoneCall className="w-10 h-10 text-emerald-300" />
                )}
              </div>
              <h2 className="text-xl font-black mb-3">
                {consultationType === "VIDEO" ? t("Ready for video session") : t("Ready for audio session")}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                {mediaError || roomAccessError || callStateMessage || t("Join when your consultation window is active.")}
              </p>
              <button
                type="button"
                onClick={() => void joinRoom()}
                disabled={!canJoinCall || !guestVideoRoomCode || isLoadingRoom || isJoiningCall}
                className={`mt-8 w-full rounded-2xl px-5 py-4 font-black transition ${
                  !canJoinCall || !guestVideoRoomCode || isLoadingRoom || isJoiningCall
                    ? "bg-white/10 text-slate-500 cursor-not-allowed"
                    : "bg-emerald-400 text-slate-950"
                }`}
              >
                {isLoadingRoom
                  ? t("Loading room...")
                  : isJoiningCall
                    ? t("Joining call...")
                    : consultationType === "VIDEO"
                      ? t("Join Video Call")
                      : t("Join Audio Call")}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 grid gap-4 md:grid-cols-2">
              {peers.map((peer) => (
                <PeerTile key={peer.id} peer={peer} />
              ))}
            </div>
            {(mediaError || roomAccessError) && (
              <div className="px-4 pb-2">
                <div className="rounded-2xl bg-amber-500/10 border border-amber-400/20 px-4 py-3 text-sm text-amber-100">
                  {mediaError || roomAccessError}
                </div>
              </div>
            )}
            <div className="px-4 pb-5">
              <div className="rounded-[2rem] bg-white/5 border border-white/10 p-4 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => void toggleAudio()}
                  className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    isAudioOn ? "bg-white text-slate-900" : "bg-rose-500 text-white"
                  }`}
                >
                  {isAudioOn ? <FaMicrophone className="w-5 h-5" /> : <FaMicrophoneSlash className="w-5 h-5" />}
                </button>
                {consultationType === "VIDEO" ? (
                  <button
                    type="button"
                    onClick={() => void toggleVideo()}
                    className={`w-14 h-14 rounded-full flex items-center justify-center ${
                      isVideoOn ? "bg-white text-slate-900" : "bg-rose-500 text-white"
                    }`}
                  >
                    <MdVideoCameraFront className="w-6 h-6" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => void leaveRoom()}
                  className="px-5 py-4 rounded-full bg-rose-500 text-white font-black"
                >
                  {t("Leave")}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Page>
  );
};

const PeerTile = ({ peer }: { peer: any }) => {
  const { t } = useTranslation();
  const { videoRef } = useVideo({ trackId: peer.videoTrack });
  const isVideoEnabled = useHMSStore(selectIsPeerVideoEnabled(peer.id));
  const isAudioEnabled = useHMSStore(selectIsPeerAudioEnabled(peer.id));

  return (
    <div className="relative aspect-video rounded-[2rem] overflow-hidden bg-slate-900 border border-white/10">
      {isVideoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          muted={peer.isLocal}
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-900">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-2xl font-black">
            {peer.name?.charAt(0) || "?"}
          </div>
        </div>
      )}
      <div className="absolute left-4 bottom-4 px-3 py-2 rounded-full bg-black/50 text-sm font-semibold">
        {peer.name} {peer.isLocal ? `(${t("You")})` : ""}
      </div>
      {!isAudioEnabled ? (
        <div className="absolute top-4 right-4 px-3 py-2 rounded-full bg-rose-500 text-xs font-black uppercase tracking-widest">
          {t("Mic Off")}
        </div>
      ) : null}
    </div>
  );
};

export default SessionCallPage;
