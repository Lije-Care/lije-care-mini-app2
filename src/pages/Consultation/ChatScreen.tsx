import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaPaperPlane } from "react-icons/fa";
import api from "@/api/axios";
import socket from "@/utils/socket";
import MessageList from "./MessageList";
import { Page } from "@/components/Page";
import { APP_BACK_INTENT_EVENT } from "@/navigation/back";

/**
 * Telegram owns booking and text messaging only. Audio/video consultations are
 * launched from CallCenterView into the dedicated browser entry.
 */
const ChatScreen = () => {
  const { t } = useTranslation();
  const { doctorId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get("bookingId");
  const actionType = searchParams.get("actionType");
  const [doctorName, setDoctorName] = useState("");
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);
  const telegramUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = telegramUser?.id as string | undefined;
  const textOnly = !bookingId || actionType === "TEXT";

  useEffect(() => {
    const handleBack = (event: Event) => {
      event.preventDefault();
      navigate("/consultation", { replace: true });
    };
    window.addEventListener(APP_BACK_INTENT_EVENT, handleBack);
    return () => window.removeEventListener(APP_BACK_INTENT_EVENT, handleBack);
  }, [navigate]);

  useEffect(() => {
    if (!doctorId) return;
    api
      .get(`/specialists/find-one/${doctorId}`)
      .then((response) => setDoctorName(response.data?.firstName || "Specialist"))
      .catch(() => setDoctorName("Specialist"));
  }, [doctorId]);

  useEffect(() => {
    if (!currentUserId || !doctorId || !textOnly) return;
    setError(null);
    api
      .post(bookingId ? "/chat/rooms/find-or-create" : "/chat/support/room", bookingId ? { bookingId } : {})
      .then((response) => setChatRoomId(response.data.id))
      .catch((requestError) =>
        setError(requestError?.response?.data?.message || t("Unable to open messages.")),
      );
  }, [bookingId, currentUserId, doctorId, t, textOnly]);

  useEffect(() => {
    fetchedRef.current = false;
    setMessages([]);
  }, [chatRoomId]);

  useEffect(() => {
    if (!chatRoomId || fetchedRef.current) return;
    fetchedRef.current = true;
    api
      .get(`/chat/room/${chatRoomId}/messages`)
      .then((response) => setMessages(response.data))
      .catch(() => setError(t("Unable to load messages.")));
  }, [chatRoomId, t]);

  useEffect(() => {
    if (!chatRoomId) return;
    socket.emit("join_room", chatRoomId);
    const receive = (next: any) => setMessages((current) => [...current, next]);
    socket.on("receive_message", receive);
    return () => {
      socket.off("receive_message", receive);
    };
  }, [chatRoomId]);

  const sendMessage = () => {
    if (!message.trim() || !chatRoomId || !currentUserId || !textOnly) return;
    socket.emit("send_message", {
      content: message,
      chatRoomId,
      senderId: currentUserId,
    });
    setMessage("");
  };

  return (
    <Page back>
      <div className="flex min-h-[calc(100vh-60px)] w-full flex-col">
        <header className="p-4 shadow-md">
          <h2 className="text-lg font-semibold text-teal-700">{doctorName}</h2>
        </header>
        {!textOnly && (
          <div className="m-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {t("Audio and video consultations open in your external browser from the Sessions tab.")}
          </div>
        )}
        {error && <div className="m-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <MessageList messages={messages} currentUserId={currentUserId || ""} />
        </div>
        <div className="flex items-center gap-2 p-4 shadow-md">
          <input
            className="flex-1 rounded-full border px-4 py-2 disabled:bg-slate-100"
            placeholder={t("Write here...")}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && sendMessage()}
            disabled={!textOnly}
          />
          <button type="button" className="p-2 text-teal-600 disabled:text-slate-300" onClick={sendMessage} disabled={!textOnly}>
            <FaPaperPlane className="h-6 w-6" />
          </button>
        </div>
      </div>
    </Page>
  );
};

export default ChatScreen;
