import { useState } from "react";

function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (text.trim() === "") {
      return;
    }

    onSend(text.trim());
    setText("");
  }

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder={disabled ? "Connecting..." : "Type a message"}
        value={text}
        maxLength={500}
        disabled={disabled}
        onChange={(event) => setText(event.target.value)}
      />
      <button type="submit" disabled={disabled}>
        Send
      </button>
    </form>
  );
}

export default MessageInput;
