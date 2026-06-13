import { RootState } from "@/redux/store";
import { SendHorizontal } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

type Message = {
  role: "user" | "assistant";
  content: string;
};

interface ChatBoxProps {
  userId: string;
  childId?: string;
  initialChatId?: string;
  backendUrl: string; // pass NestJS URL as a prop
}

export default function ChatBox({
  userId,
  childId,
  initialChatId,
  backendUrl,
}: ChatBoxProps) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const chatStorageKey = childId ? `ai_chat_${userId}_${childId}` : null;
  const [chatId, setChatId] = useState<string | null>(initialChatId ?? null);
  const parentState = useSelector((state: RootState) => state.parent);
  const fallbackParentId = parentState?.userDetails.id;

  useEffect(() => {
    if (!chatStorageKey) return;
    const savedChatId = localStorage.getItem(chatStorageKey);
    if (savedChatId) {
      setChatId(savedChatId);
      return;
    }

    setChatId(initialChatId ?? null);
  }, [chatStorageKey, initialChatId]);

  // Scroll to bottom when messages change (if user is near bottom)
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const isNearBottom =
      chatContainer.scrollHeight -
        chatContainer.scrollTop -
        chatContainer.clientHeight <
      100;

    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, newMessage]);

    try {
      const languageLabel = i18n.language === "am" ? "Amharic" : "English";
      const res = await fetch(`${backendUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId || fallbackParentId,
          childId,
          chatId,
          message: `[Reply language: ${languageLabel}] ${input}`,
        }),
      });

      if (!res.ok) throw new Error(t("Failed to send message"));

      const data: { reply: string; chatId?: string } = await res.json();
      const botMessage: Message = { role: "assistant", content: data.reply };

      if (data.chatId) {
        setChatId(data.chatId);
        if (chatStorageKey) {
          localStorage.setItem(chatStorageKey, data.chatId);
        }
      }

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        role: "assistant",
        content: t("Sorry, something went wrong."),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setInput("");
    }
  };

  return (
    <div className="max-w-lg mx-auto border border-gray-600 rounded-xl p-4">
      {/* Scrollable messages container */}
      <div
        ref={chatContainerRef}
        className="h-96 overflow-y-auto mb-4 space-y-2 scroll-smooth"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "text-right" : "text-left"}
          >
            <span
              className={`inline-block px-3 py-2 rounded-xl ${
                m.role === "user" ? "bg-gray-400 text-white" : "bg-gray-500"
              }`}
            >
              {m.content}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input section */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 border rounded px-3 py-2"
          placeholder={t("Ask something...")}
        />
        <button
          onClick={sendMessage}
          className="bg-[#0B8FAC] text-white px-2 rounded"
        >
          <SendHorizontal />
        </button>
      </div>
    </div>
  );
}
