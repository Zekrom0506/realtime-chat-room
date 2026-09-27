import { useState } from "react";

// sidebar that shows all rooms and a small form to create a new one
function RoomList({ rooms, currentRoom, onSelectRoom, onCreateRoom }) {
  const [newRoomName, setNewRoomName] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (newRoomName.trim() === "") {
      return;
    }

    onCreateRoom(newRoomName.trim());
    setNewRoomName("");
  }

  return (
    <div className="room-list">
      <h3>Rooms</h3>

      {rooms.length === 0 && <p className="empty-text">No rooms yet. Create one below.</p>}

      <ul>
        {rooms.map((room) => {
          const isActive = currentRoom && currentRoom._id === room._id;

          return (
            <li key={room._id}>
              <button
                className={isActive ? "room-button active" : "room-button"}
                onClick={() => onSelectRoom(room)}
              >
                # {room.name}
              </button>
            </li>
          );
        })}
      </ul>

      <form className="new-room-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="New room name"
          value={newRoomName}
          maxLength={30}
          onChange={(event) => setNewRoomName(event.target.value)}
        />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}

export default RoomList;
