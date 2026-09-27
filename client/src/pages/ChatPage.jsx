import { useEffect, useState } from "react";
import { getRooms, createRoom } from "../api";
import RoomList from "../components/RoomList.jsx";

function ChatPage({ user, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [error, setError] = useState("");

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

  async function handleCreateRoom(name) {
    setError("");

    try {
      const room = await createRoom(name, user.token);
      setRooms(rooms.concat(room));
    } catch (err) {
      setError(err.message);
    }
  }

  function handleSelectRoom(room) {
    setCurrentRoom(room);
  }

  return (
    <div className="chat-page">
      <header className="chat-header">
        <h1>Chat Room</h1>
        <div className="header-right">
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
            <h2 className="room-title"># {currentRoom.name}</h2>
          ) : (
            <p className="empty-text">Pick a room on the left to start chatting.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
