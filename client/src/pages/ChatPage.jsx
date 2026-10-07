import { useEffect, useRef, useState } from "react";
import { getRooms, createRoom, getMessages } from "../api";
import RoomList from "../components/RoomList.jsx";
import MessageList from "../components/MessageList.jsx";
import MessageInput from "../components/MessageInput.jsx";

function ChatPage({ user, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [serverName, setServerName] = useState("");
  const [error, setError] = useState("");

  // refs are used for values that the WebSocket handlers need to read.
  // the handlers are created only once, so they would see old state values.
  const socketRef = useRef(null);
  const currentRoomRef = useRef(null);

  // load the list of rooms when the page opens
  useEffect(() => {
    async function loadRooms() {
      try {
        const data = await getRooms(user.token);
        setRooms(data);
      } catch (err) {
        setError(err.message);
      }
    }

    loadRooms();
  }, [user.token]);

  // load the old messages of a room from MongoDB (through the REST API)
  // and then tell the server over the WebSocket that we want to join it
  async function enterRoom(room) {
    try {
      const history = await getMessages(room._id, user.token);

      // the user may have clicked another room while we were loading
      if (currentRoomRef.current._id !== room._id) {
        return;
      }

      setMessages(history);

      const socket = socketRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "join", roomId: room._id }));
      }
    } catch (err) {
      setError(err.message);
    }
  }

  // open the WebSocket connection when the page opens
  useEffect(() => {
    let shouldReconnect = true;
    let reconnectTimer = null;

    function connect() {
      // use wss:// when the page is on https://, otherwise ws://
      let protocol = "ws:";
      if (window.location.protocol === "https:") {
        protocol = "wss:";
      }

      const url = protocol + "//" + window.location.host + "/ws?token=" + user.token;
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        setConnected(true);

        // if we were in a room before the connection dropped, go back into it
        if (currentRoomRef.current) {
          enterRoom(currentRoomRef.current);
        }
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "connected") {
          setServerName(data.server);
        } else if (data.type === "message" || data.type === "system") {
          // only show messages for the room that is open right now
          const room = currentRoomRef.current;
          if (room && room._id === data.roomId) {
            setMessages((oldMessages) => oldMessages.concat(data));
          }
        } else if (data.type === "error") {
          setError(data.message);
        }
      };

      socket.onclose = (event) => {
        setConnected(false);

        // 4001 is the code our server uses for a bad or expired token
        if (event.code === 4001) {
          onLogout();
          return;
        }

        // the server may have gone down, try again in 2 seconds
        if (shouldReconnect) {
          reconnectTimer = setTimeout(connect, 2000);
        }
      };
    }

    connect();

    // close the connection when the user leaves the page or logs out
    return () => {
      shouldReconnect = false;
      clearTimeout(reconnectTimer);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [user.token]);

  async function handleCreateRoom(name) {
    setError("");

    try {
      const room = await createRoom(name, user.token);
      setRooms(rooms.concat(room));
      handleSelectRoom(room);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleSelectRoom(room) {
    setError("");
    setMessages([]);
    setCurrentRoom(room);
    currentRoomRef.current = room;
    enterRoom(room);
  }

  function handleSendMessage(text) {
    const socket = socketRef.current;

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "message", text: text }));
    }
  }

  return (
    <div className="chat-page">
      <header className="chat-header">
        <h1>Chat Room</h1>
        <div className="header-right">
          <span className={connected ? "status online" : "status offline"}>
            {connected ? "Connected to " + serverName : "Disconnected"}
          </span>
          <span>Logged in as {user.username}</span>
          <button onClick={onLogout}>Log out</button>
        </div>
      </header>

      <div className="chat-body">
        <RoomList
          rooms={rooms}
          currentRoom={currentRoom}
          onSelectRoom={handleSelectRoom}
          onCreateRoom={handleCreateRoom}
        />

        <div className="chat-main">
          {error && <p className="error">{error}</p>}

          {currentRoom ? (
            <>
              <h2 className="room-title"># {currentRoom.name}</h2>
              <MessageList messages={messages} currentUsername={user.username} />
              <MessageInput onSend={handleSendMessage} disabled={!connected} />
            </>
          ) : (
            <p className="empty-text">Pick a room on the left to start chatting.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
