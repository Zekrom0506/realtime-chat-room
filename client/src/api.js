// all the calls to the backend REST API are in this file

// helper that sends a request and returns the JSON response
async function request(path, method, body, token) {
  const options = {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (token) {
    options.headers["Authorization"] = "Bearer " + token;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch("/api" + path, options);
  const data = await response.json();

  // the backend sends { message: "..." } when something goes wrong
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export function registerUser(username, password) {
  return request("/auth/register", "POST", { username, password });
}

export function loginUser(username, password) {
  return request("/auth/login", "POST", { username, password });
}

export function getRooms(token) {
  return request("/rooms", "GET", null, token);
}

export function createRoom(name, token) {
  return request("/rooms", "POST", { name }, token);
}

export function getMessages(roomId, token) {
  return request("/rooms/" + roomId + "/messages", "GET", null, token);
}
