import { useEffect, useRef } from "react";

// turn a date string into a short time like "09:41"
function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function MessageList({ messages, currentUsername }) {
  const bottomRef = useRef(null);

  // scroll to the newest message every time the list changes
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView();
    }
  }, [messages]);

  return (
    <div className="message-list">
      {messages.length === 0 && <p className="empty-text">No messages yet. Say hello!</p>}

      {messages.map((message, index) => {
        // system messages are things like "alice joined the room"
        if (message.type === "system") {
          return (
            <p key={index} className="system-message">
              {message.text}
            </p>
          );
        }

        const isMine = message.username === currentUsername;

        return (
          <div key={message._id} className={isMine ? "message mine" : "message"}>
            <div className="message-info">
              <span className="message-user">{message.username}</span>
              <span className="message-time">{formatTime(message.createdAt)}</span>
              {message.server && <span className="message-server">via {message.server}</span>}
            </div>
            <div className="message-text">{message.text}</div>
          </div>
        );
      })}

      <div ref={bottomRef}></div>
    </div>
  );
}

export default MessageList;
