import { Message } from '@/types';
import React, { useEffect, useRef } from 'react';

interface Props {
  messages: Message[];
  currentUserId: string;
}

const MessageList: React.FC<Props> = ({ messages, currentUserId }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="p-4 space-y-2 overflow-y-auto max-h-[400px]" // You can adjust max-height if needed
    >
      {messages.map((msg) => {
        const isCurrentUser = msg.senderId === currentUserId;
        return (
          <div
            key={msg.id}
            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`p-2 rounded-lg max-w-xs break-words ${
                isCurrentUser
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-200 text-black rounded-bl-none'
              }`}
            >
              {msg.content}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;
