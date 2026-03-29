import  { useState } from "react";
import { useHMSActions, useHMSStore, selectHMSMessages } from "@100mslive/react-sdk";

const Chat = () => {
  const hmsActions = useHMSActions();
  const messages = useHMSStore(selectHMSMessages);
  const [message, setMessage] = useState("");

  const sendMessage = async () => {
    if (message.trim()) {
      await hmsActions.sendBroadcastMessage(message);
      setMessage("");
    }
  };

  return (
    <div style={{ maxWidth: "300px", border: "1px solid #ccc", padding: "10px" }}>
      <div style={{ height: "200px", overflowY: "auto" }}>
        {messages.map((msg, index) => (
          <p key={index}>
            <b>{msg.senderName}:</b> {msg.message}
          </p>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        style={{ width: "80%" }}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chat;
