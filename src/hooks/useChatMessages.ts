import { useEffect, useState } from "react";
import api from '@/api/axios';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  
}

export const useChatMessages = (roomId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);

  const fetchMessages = async () => {
    try {
      const response = await api.get(`chat/room/${roomId}`);
      setMessages(response.data);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  useEffect(() => {
    fetchMessages(); // Initial fetch
    const interval = setInterval(fetchMessages, 1000); // Fetch every second
    return () => clearInterval(interval); // Cleanup
  }, []);

  return messages;
};
