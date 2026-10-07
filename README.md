# Real-Time Chat Room

A real-time chat app built with the MERN stack (MongoDB, Express, React, Node.js).
Users register and log in, join a room, and see new messages instantly over WebSockets.
Old messages are loaded from MongoDB when a room is opened.

Two copies of the server run behind an Nginx load balancer. Redis pub/sub passes
messages between the two copies, so users connected to different copies still see
each other's messages.

## Tech stack

- **Client:** React (Vite)
- **Server:** Node.js, Express, `ws` (WebSockets)
- **Database:** MongoDB (Mongoose)
- **Messaging between servers:** Redis pub/sub
- **Auth:** JWT, passwords hashed with bcrypt
- **Deployment:** Docker Compose, Nginx load balancer

## How it works

```
                 Browser (React)
                       |
                 Nginx  (port 8080)
                 /             \
           server-1          server-2        <- same Node.js code, two copies
                 \             /
              Redis pub/sub channel
                       |
                    MongoDB
```

1. The user logs in and gets a JWT token.
2. The React app opens a WebSocket to `/ws?token=...`. Nginx sends the connection
   to one of the two server copies.
3. When the user opens a room, the client loads the last 50 messages from
   `GET /api/rooms/:roomId/messages` (MongoDB) and sends a `join` message on the WebSocket.
4. When a user sends a message, the server saves it in MongoDB and **publishes** it
   to a Redis channel.
5. Both server copies are **subscribed** to that channel. Each copy sends the
   message to its own connected users who are in that room.

Without step 4 and 5, a user on server-1 would never see a message from a user on server-2,
because each server only knows about its own WebSocket connections.

## Run with Docker (recommended)

You need Docker Desktop installed and running.

```bash
docker compose up --build
```

Then open http://localhost:8080

To stop everything:

```bash
docker compose down
```

### Checking that both servers are used

- The green badge in the top right shows which copy your WebSocket is connected to
  (`server-1` or `server-2`).
- Open the app in two different browsers (or one normal and one incognito window),
  register two users and join the same room. If both show the same server, refresh one of them.
- New messages show `via server-1` or `via server-2`, which is the copy that received the message.
- You can also call `http://localhost:8080/api/health` a few times and see the server name change.

## Run without Docker (development)

You need Node.js, and MongoDB and Redis running on your machine.

Server:

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Client (in a second terminal):

```bash
cd client
npm install
npm run dev
```

Then open http://localhost:5173

## API

| Method | Route                          | Description                    |
| ------ | ------------------------------ | ------------------------------ |
| POST   | `/api/auth/register`           | Create an account              |
| POST   | `/api/auth/login`              | Log in, returns a JWT token    |
| GET    | `/api/rooms`                   | List all rooms                 |
| POST   | `/api/rooms`                   | Create a room                  |
| GET    | `/api/rooms/:roomId/messages`  | Last 50 messages of a room     |
| GET    | `/api/health`                  | Shows which server copy answered |

All `/api/rooms` routes need the header `Authorization: Bearer <token>`.

### WebSocket messages

Client to server:

```json
{ "type": "join", "roomId": "..." }
{ "type": "message", "text": "hello" }
```

Server to client:

```json
{ "type": "connected", "server": "server-1" }
{ "type": "joined", "roomId": "..." }
{ "type": "message", "roomId": "...", "username": "alice", "text": "hello", "createdAt": "...", "server": "server-1" }
{ "type": "system", "roomId": "...", "text": "alice joined the room" }
```

## Project structure

```
client/               React app
  src/pages/          AuthPage (login/register), ChatPage
  src/components/     RoomList, MessageList, MessageInput
  src/api.js          REST API calls
server/
  src/index.js        Express app + HTTP server
  src/websocket.js    WebSocket server (join room, send message)
  src/redis.js        Redis publish / subscribe
  src/routes/         auth and rooms routes
  src/models/         User, Room, Message
  src/middleware/     JWT check
nginx/nginx.conf      load balancer config
docker-compose.yml    mongo, redis, server1, server2, client, nginx
```
