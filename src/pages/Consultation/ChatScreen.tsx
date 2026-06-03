"use client";

import {
  useHMSActions,
  useHMSStore,
  selectIsConnectedToRoom,
  selectPeers,
  selectIsLocalVideoEnabled,
  selectIsPeerVideoEnabled,
  selectIsPeerAudioEnabled,
  selectIsLocalAudioEnabled,
  useVideo,
} from "@100mslive/react-sdk";

import { FiPhoneCall } from "react-icons/fi";
import { MdVideoCameraFront } from "react-icons/md";
import { FaMicrophone, FaMicrophoneSlash, FaPaperPlane } from "react-icons/fa";
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "@/api/axios";
import socket from "@/utils/socket";
import MessageList from "./MessageList";
import { Page } from "@/components/Page";
import { useBookings } from "@/hooks/useBookings";
import { APP_BACK_INTENT_EVENT } from "@/navigation/back";
import type { ConsultationOrder } from "@/types/consultationOrder";
import type { Booking } from "@/types/booking";

const getSlotWindowState = (slot: Booking["slot"]) => {
  try {
    const slotDate = slot.date.split("T")[0];
    const start = new Date(`${slotDate}T${slot.startTime}:00`);
    const end = new Date(`${slotDate}T${slot.endTime}:00`);
    const now = new Date();

    if (now < start) return "upcoming" as const;
    if (now > end) return "ended" as const;
    return "active" as const;
  } catch {
    return "unknown" as const;
  }
};

const getReadableMediaError = (
  error: unknown,
  consultationType: "TEXT" | "AUDIO" | "VIDEO" | null,
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

const ChatScreen = () => {
  const { t } = useTranslation();
  const { bookings } = useBookings();
  const { doctorId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get("bookingId");
  const requestedActionType = searchParams.get("actionType") as
    | "TEXT"
    | "AUDIO"
    | "VIDEO"
    | null;

  // Intercept the Telegram back button before navigate(-1) runs.
  // In the Telegram Mini App WebView, window.history.go(-1) can trigger
  // native "close app" behavior. Navigating explicitly to /consultation
  // uses pushState/replaceState instead, which the WebView handles correctly.
  useEffect(() => {
    const handleBackIntent = (e: Event) => {
      e.preventDefault();
      navigate("/consultation", { replace: true });
    };
    window.addEventListener(APP_BACK_INTENT_EVENT, handleBackIntent);
    return () => window.removeEventListener(APP_BACK_INTENT_EVENT, handleBackIntent);
  }, [navigate]);

  const [activeSlotBooking, setActiveSlotBooking] = useState<any>(null);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [chatRoomId, setChatRoomId] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [consultationOrders, setConsultationOrders] = useState<ConsultationOrder[]>([]);
  const [roomAccessError, setRoomAccessError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isJoiningCall, setIsJoiningCall] = useState(false);
  const messagesFetched = useRef(false);

  // const [videoRoomId, setVideoRoomId] = useState<string | null>(null); // New: Track video room
  const [isLoadingRoom, setIsLoadingRoom] = useState(true); // New: Track fetch
  // Add states
  const [guestVideoRoomCode, setGuestVideoRoomCode] = useState<string | null>(
    null
  );

  const telegramUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = telegramUser?.id;
  const selectedBooking = bookingId
    ? bookings.find((booking) => booking.id === bookingId)
    : null;
  const selectedOrder = bookingId
    ? consultationOrders.find((order) => order.bookingId === bookingId)
    : null;
  const isSessionScopedChat = Boolean(bookingId);
  const hasBookingMismatch = Boolean(
    selectedBooking &&
      doctorId &&
      (selectedBooking.expertId !== doctorId || selectedBooking.parentId !== currentUserId),
  );
  const slotWindowState = selectedBooking ? getSlotWindowState(selectedBooking.slot) : "unknown";
  const isConfirmedBooking = selectedOrder?.status === "CONFIRMED";
  const consultationType = selectedOrder?.consultationType ?? null;
  const canSendMessages =
    isSessionScopedChat &&
    Boolean(selectedBooking) &&
    !hasBookingMismatch &&
    isConfirmedBooking &&
    consultationType === "TEXT" &&
    slotWindowState === "active";
  const canJoinCall =
    isSessionScopedChat &&
    Boolean(selectedBooking) &&
    !hasBookingMismatch &&
    isConfirmedBooking &&
    (consultationType === "AUDIO" || consultationType === "VIDEO") &&
    slotWindowState === "active";
  const isReadOnlyChat = isSessionScopedChat && !canSendMessages;

  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);
  const isAudioOn = useHMSStore(selectIsLocalAudioEnabled);
  const peers = useHMSStore(selectPeers);
  const visiblePeers = peers.length > 0 ? peers : [{ id: "local-placeholder", name: "Parent", isLocal: true }];

  let accessMessage: string | null = null;
  if (isSessionScopedChat) {
    if (!selectedBooking || !selectedOrder) {
      accessMessage = t("We couldn't verify this consultation session.");
    } else if (hasBookingMismatch) {
      accessMessage = t("This consultation does not belong to the selected expert.");
    } else if (selectedOrder.status === "PENDING_ADMIN_CONFIRMATION") {
      accessMessage = t("This consultation is awaiting approval.");
    } else if (selectedOrder.status === "REJECTED") {
      accessMessage = t("This consultation was rejected.");
    } else if (consultationType === "TEXT" && slotWindowState === "upcoming") {
      accessMessage = t("This chat will open when your consultation starts.");
    } else if (consultationType === "TEXT" && slotWindowState === "ended") {
      accessMessage = t("This chat is closed because the consultation time has ended.");
    } else if ((consultationType === "AUDIO" || consultationType === "VIDEO") && slotWindowState !== "active") {
      accessMessage = t("This call will open only during the booked consultation window.");
    } else if (consultationType === "AUDIO") {
      accessMessage = isConnected
        ? null
        : t("This is an audio consultation. Join the call during the active session window.");
    } else if (consultationType === "VIDEO") {
      accessMessage = isConnected
        ? null
        : t("This is a video consultation. Join the call during the active session window.");
    }
  }

  const requestDeviceAccess = async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      throw new Error(t("Your device does not support in-app audio/video permissions."));
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: consultationType === "VIDEO",
    });
    stream.getTracks().forEach((track) => track.stop());
  };

  useEffect(() => {
    if (!selectedBooking) {
      setActiveSlotBooking(null);
      return;
    }

    const checkActiveSlot = () => {
      const isActive = getSlotWindowState(selectedBooking.slot) === "active";
      setActiveSlotBooking(isActive ? selectedBooking : null);
    };

    checkActiveSlot();
    const interval = setInterval(checkActiveSlot, 1000);

    return () => clearInterval(interval);
  }, [selectedBooking]);

  // --- Countdown for active slot ---
  useEffect(() => {
    if (!activeSlotBooking || !activeSlotBooking.slot) return;

    const slot = activeSlotBooking.slot;
    const end = new Date(`${slot.date.split("T")[0]}T${slot.endTime}:00`);

    const updateCountdown = () => {
      const now = new Date();
      const diffMs = end.getTime() - now.getTime();

      if (diffMs <= 0) {
        setCountdown("00:00");
        if (isConnected) leaveRoom();
        return;
      }

      const minutes = Math.floor(diffMs / 1000 / 60);
      const seconds = Math.floor((diffMs / 1000) % 60);
      setCountdown(
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
          2,
          "0"
        )}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [activeSlotBooking, isConnected]);

  // --- Load doctor info ---
  useEffect(() => {
    if (doctorId) {
      api
        .get(`/specialists/find-one/${doctorId}`)
        .then((res) => setSelectedDoctor(res.data))
        .catch(() => console.error("Doctor not found"));
    }
  }, [doctorId]);

  useEffect(() => {
    if (!currentUserId) {
      setConsultationOrders([]);
      return;
    }

    api
      .get(`/consultation-order/my-orders/${currentUserId}`)
      .then((res) => setConsultationOrders(res.data ?? []))
      .catch((err) => {
        console.error("Failed to load consultation orders:", err);
        setConsultationOrders([]);
      });
  }, [currentUserId]);

  // In fetch useEffect:
  // NOTE: We use `doctorId` directly from URL params instead of `selectedDoctor?.id`
  // so that the room is created immediately — even for non-specialist users such as
  // CUSTOMER_SUPPORT agents whose profile is not exposed by /specialists/find-one.
  useEffect(() => {
    if (telegramUser?.id && doctorId) {
      setIsLoadingRoom(true);
      setRoomAccessError(null);
      api
        .post("/chat/rooms/find-or-create", {
          parentId: telegramUser.id,
          expertId: doctorId,
          ...(bookingId ? { bookingId } : {}),
          ...(requestedActionType ? { actionType: requestedActionType } : {}),
        })
        .then((res) => {
          setChatRoomId(res.data.id);
          setGuestVideoRoomCode(res.data.guestVideoRoomCode); // Use guest code
          // setVideoRoomId(res.data.guestVideoRoomCode); // Alias if needed
          setIsLoadingRoom(false);
        })
        .catch((err) => {
          console.error("Failed to load or create chat room:", err);
          setRoomAccessError(
            err?.response?.data?.message ||
              t("We couldn't verify this consultation session."),
          );
          setIsLoadingRoom(false);
        });
    }
  }, [telegramUser?.id, doctorId, bookingId, requestedActionType, t]);
  // --- Load messages ---
  useEffect(() => {
    messagesFetched.current = false;
    setMessages([]);
  }, [chatRoomId]);

  useEffect(() => {
    if (chatRoomId && !messagesFetched.current) {
      messagesFetched.current = true;
      api
        .get(`/chat/room/${chatRoomId}/messages`)
        .then((res) => setMessages(res.data))
        .catch((err) => console.error(err));
    }
  }, [chatRoomId]);

  // --- Listen for socket messages ---
  // useEffect(() => {
  //   const handler = (msg: any) => setMessages((prev) => [...prev, msg]);
  //   socket.on("receive_message", handler);

  //   // Cleanup: remove the listener when component unmounts
  //   return () => {
  //     socket.off("receive_message", handler);
  //   };
  // }, []);

  // --- Peer View Component ---
  const PeerView = ({ peer }: { peer: any }) => {
    const { videoRef } = useVideo({ trackId: peer.videoTrack });
    const isVideoEnabled = useHMSStore(selectIsPeerVideoEnabled(peer.id));
    const isAudioEnabled = useHMSStore(selectIsPeerAudioEnabled(peer.id));

    return (
      <div className="relative w-full aspect-video max-w-sm rounded-lg overflow-hidden shadow-lg">
        {isVideoEnabled ? (
          <video
            ref={videoRef}
            autoPlay
            muted={peer.isLocal}
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
            <span className="text-lg">{peer.name.charAt(0)}</span>
          </div>
        )}
        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
          {peer.name} {peer.isLocal && `(${t("You")})`}
        </div>
        {!isAudioEnabled && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
            {t("Mic Off")}
          </div>
        )}
      </div>
    );
  };

  // In joinRoom:
  const joinRoom = async () => {
    if (!canJoinCall || !guestVideoRoomCode || !activeSlotBooking) {
      alert(
        accessMessage || t("Video room or active slot not ready. Please wait for the slot to start.")
      );
      return;
    }

    try {
      setIsJoiningCall(true);
      setMediaError(null);
      await requestDeviceAccess();
      const authToken = await hmsActions.getAuthTokenByRoomCode({
        roomCode: guestVideoRoomCode, // Now valid code
      });
      await hmsActions.join({ userName: "Parent", authToken });
    } catch (e) {
      console.error("Failed to join room:", e);
      const nextError = getReadableMediaError(e, consultationType, t);
      setMediaError(nextError);
      alert(nextError);
    } finally {
      setIsJoiningCall(false);
    }
  };

  const leaveRoom = async () => await hmsActions.leave();
  const toggleVideo = async () => {
    try {
      setMediaError(null);
      if (!isVideoOn) {
        await requestDeviceAccess();
      }
      await hmsActions.setLocalVideoEnabled(!isVideoOn);
    } catch (e) {
      const nextError = getReadableMediaError(e, "VIDEO", t);
      setMediaError(nextError);
    }
  };
  const toggleAudio = async () => {
    try {
      setMediaError(null);
      if (!isAudioOn) {
        await requestDeviceAccess();
      }
      await hmsActions.setLocalAudioEnabled(!isAudioOn);
    } catch (e) {
      const nextError = getReadableMediaError(e, "AUDIO", t);
      setMediaError(nextError);
    }
  };

  useEffect(() => {
    if (!isConnected) return;

    const syncLocalMedia = async () => {
      try {
        setMediaError(null);
        await hmsActions.setLocalAudioEnabled(true);
        await hmsActions.setLocalVideoEnabled(consultationType === "VIDEO");
      } catch (e) {
        const nextError = getReadableMediaError(e, consultationType, t);
        setMediaError(nextError);
      }
    };

    void syncLocalMedia();
  }, [consultationType, hmsActions, isConnected, t]);

  const sendMessage = async () => {
    if (!message.trim() || !chatRoomId || !currentUserId) return;
    if (isSessionScopedChat && !canSendMessages) return;

    const payload = {
      content: message,
      chatRoomId,
      senderId: currentUserId,
    };

    socket.emit("send_message", payload);

    setMessage("");
  };

  useEffect(() => {
    if (!chatRoomId) return;

    socket.emit("join_room", chatRoomId);

    const handler = (msg: any) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("receive_message", handler);

    // CLEANUP — must return ONLY a function
    return () => {
      socket.off("receive_message", handler);
    };
  }, [chatRoomId]);

  return (
    <Page back={true}>
      <div
        style={{ minHeight: "calc(100vh - 60px)" }}
        className="flex flex-col w-full"
      >
        <div className="flex items-center justify-between p-4 shadow-md">
          <h2 className="text-lg font-semibold text-teal-700">
            {selectedDoctor?.firstName || selectedBooking?.expert.firstName}
          </h2>
          {countdown && isConnected && (
            <span className="text-sm text-red-600 font-medium">
              {t("Call ends in")} {countdown}
            </span>
          )}
          <div className="flex space-x-2">
            {!isConnected &&
              canJoinCall &&
              activeSlotBooking &&
              guestVideoRoomCode &&
              !isLoadingRoom && (
                <button className="p-2" onClick={joinRoom} disabled={isJoiningCall}>
                  {consultationType === "VIDEO" ? (
                    <MdVideoCameraFront className="h-6 w-6 text-green-600" />
                  ) : (
                    <FiPhoneCall className="h-6 w-6 text-green-600" />
                  )}
                </button>
              )}
            {isJoiningCall && (
              <span className="text-sm text-gray-500">{t("Joining call...")}</span>
            )}
            {isLoadingRoom && (
              <span className="text-sm text-gray-500">{t("Loading room...")}</span>
            )}

            {isConnected && (
              <>
                {consultationType === "VIDEO" && (
                  <button className="p-2" onClick={toggleVideo} title={t("Toggle Camera")}>
                    <MdVideoCameraFront className={`h-6 w-6 ${isVideoOn ? "text-black" : "text-red-500"}`} />
                  </button>
                )}
                <button className="p-2" onClick={toggleAudio}>
                  {isAudioOn ? (
                    <FaMicrophone className="h-6 w-6 text-black" />
                  ) : (
                    <FaMicrophoneSlash className="h-6 w-6 text-red-500" />
                  )}
                </button>
                <button className="p-2 text-red-600" onClick={leaveRoom}>
                  {t("Leave")}
                </button>
              </>
            )}
          </div>
        </div>

        {isConnected && (
          <div className="flex flex-wrap justify-center gap-4 p-4 bg-gray-100">
            {visiblePeers.map((peer) => (
              <PeerView key={peer.id} peer={peer} />
            ))}
            <div className="flex justify-center gap-6">
              <button
                title={t("Toggle Mic")}
                className="border rounded-full p-3 shadow-md"
                onClick={toggleAudio}
              >
                {isAudioOn ? (
                  <FaMicrophone className="h-6 w-6 text-black" />
                ) : (
                  <FaMicrophoneSlash className="h-6 w-6 text-red-500" />
                )}
              </button>
              {consultationType === "VIDEO" && (
                <button
                  title={t("Toggle Camera")}
                  className="border rounded-full p-3 shadow-md"
                  onClick={toggleVideo}
                >
                  <MdVideoCameraFront className={`h-6 w-6 ${isVideoOn ? "text-black" : "text-red-500"}`} />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-1 px-4 py-2">
          {(accessMessage || roomAccessError || mediaError) && (
            <div className="mb-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
              {mediaError || roomAccessError || accessMessage}
            </div>
          )}
          <MessageList
            messages={messages}
            currentUserId={currentUserId ?? ""}
          />
        </div>

        <div className="p-4 flex items-center gap-2 shadow-md">
          <button className="p-2">
            <FaMicrophone className="h-6 w-6 text-gray-500" />
          </button>
          <input
            type="text"
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-100 disabled:text-slate-400"
            placeholder={isReadOnlyChat ? t("Messaging is unavailable for this consultation right now.") : t("Write here...")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={isReadOnlyChat}
          />
          <button
            type="button"
            className="p-2 text-teal-600 disabled:text-slate-300"
            onClick={sendMessage}
            disabled={isReadOnlyChat}
          >
            <FaPaperPlane className="h-6 w-6" />
          </button>
        </div>
      </div>
    </Page>
  );
};

export default ChatScreen;
