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
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "@/api/axios";
import socket from "@/utils/socket";
import MessageList from "./MessageList";
import { Page } from "@/components/Page";
import { useBookings } from "@/hooks/useBookings";
import { APP_BACK_INTENT_EVENT } from "@/navigation/back";

const ChatScreen = () => {
  const { t } = useTranslation();
  const { bookings } = useBookings();
  const { doctorId } = useParams();
  const navigate = useNavigate();

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
  const messagesFetched = useRef(false);

  // const [videoRoomId, setVideoRoomId] = useState<string | null>(null); // New: Track video room
  const [isLoadingRoom, setIsLoadingRoom] = useState(true); // New: Track fetch
  // Add states
  const [guestVideoRoomCode, setGuestVideoRoomCode] = useState<string | null>(
    null
  );

  const telegramUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = telegramUser?.id;

  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);
  const isAudioOn = useHMSStore(selectIsLocalAudioEnabled);
  const peers = useHMSStore(selectPeers);

  // --- Slot checking ---
  const isSlotNow = (slot: any) => {
    const now = new Date();
    const startDateTime = new Date(
      `${slot.date.split("T")[0]}T${slot.startTime}:00`
    );
    const endDateTime = new Date(
      `${slot.date.split("T")[0]}T${slot.endTime}:00`
    );
    return now >= startDateTime && now <= endDateTime;
  };

  // Update active slot every second
  useEffect(() => {
    if (!bookings || bookings.length === 0) return;

    const checkActiveSlot = () => {
      const nowActive = bookings.find((b) => b.slot && isSlotNow(b.slot));
      setActiveSlotBooking(nowActive || null);
    };

    checkActiveSlot();
    const interval = setInterval(checkActiveSlot, 1000);

    return () => clearInterval(interval);
  }, [bookings]);

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

  // In fetch useEffect:
  // NOTE: We use `doctorId` directly from URL params instead of `selectedDoctor?.id`
  // so that the room is created immediately — even for non-specialist users such as
  // CUSTOMER_SUPPORT agents whose profile is not exposed by /specialists/find-one.
  useEffect(() => {
    if (telegramUser?.id && doctorId) {
      setIsLoadingRoom(true);
      api
        .post("/chat/rooms/find-or-create", {
          parentId: telegramUser.id,
          expertId: doctorId,
        })
        .then((res) => {
          setChatRoomId(res.data.id);
          setGuestVideoRoomCode(res.data.guestVideoRoomCode); // Use guest code
          // setVideoRoomId(res.data.guestVideoRoomCode); // Alias if needed
          setIsLoadingRoom(false);
        })
        .catch((err) => {
          console.error("Failed to load or create chat room:", err);
          setIsLoadingRoom(false);
        });
    }
  }, [telegramUser?.id, doctorId]);
  // --- Load messages ---
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
    if (!guestVideoRoomCode || !activeSlotBooking) {
      alert(
        t("Video room or active slot not ready. Please wait for the slot to start.")
      );
      return;
    }

    try {
      const authToken = await hmsActions.getAuthTokenByRoomCode({
        roomCode: guestVideoRoomCode, // Now valid code
      });
      await hmsActions.join({ userName: "Parent", authToken });
    } catch (e) {
      console.error("Failed to join room:", e);
      alert(t("Failed to join video call. Please try again."));
    }
  };

  const leaveRoom = async () => await hmsActions.leave();
  const toggleVideo = async () =>
    await hmsActions.setLocalVideoEnabled(!isVideoOn);
  const toggleAudio = async () =>
    await hmsActions.setLocalAudioEnabled(!isAudioOn);

  const sendMessage = async () => {
    if (!message.trim() || !chatRoomId || !currentUserId) return;

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
            {selectedDoctor?.firstName}
          </h2>
          {countdown && isConnected && (
            <span className="text-sm text-red-600 font-medium">
              {t("Call ends in")} {countdown}
            </span>
          )}
          <div className="flex space-x-2">
            {!isConnected &&
              activeSlotBooking &&
              guestVideoRoomCode &&
              !isLoadingRoom && (
                <button className="p-2" onClick={joinRoom}>
                  <FiPhoneCall className="h-6 w-6 text-green-600" />
                </button>
              )}
            {isLoadingRoom && (
              <span className="text-sm text-gray-500">{t("Loading room...")}</span>
            )}

            {isConnected && peers.some((peer) => peer.videoTrack) && (
              <>
                <button className="p-2" onClick={toggleVideo}>
                  <MdVideoCameraFront className="h-6 w-6 text-black" />
                </button>
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
            {peers.map((peer) => (
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
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-1 px-4 py-2">
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
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder={t("Write here...")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            type="button"
            className="p-2 text-teal-600"
            onClick={sendMessage}
          >
            <FaPaperPlane className="h-6 w-6" />
          </button>
        </div>
      </div>
    </Page>
  );
};

export default ChatScreen;
