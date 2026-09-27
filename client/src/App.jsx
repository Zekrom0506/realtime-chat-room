import { useState } from "react";
import AuthPage from "./pages/AuthPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";

// read the logged in user from localStorage so a page refresh keeps you logged in
function getSavedUser() {
  const saved = localStorage.getItem("chatUser");
  if (saved) {
    return JSON.parse(saved);
  }
  return null;
}

function App() {
  // user looks like { token: "...", username: "..." } or null
  const [user, setUser] = useState(getSavedUser());

  function handleLogin(userData) {
    localStorage.setItem("chatUser", JSON.stringify(userData));
    setUser(userData);
  }

  function handleLogout() {
    localStorage.removeItem("chatUser");
    setUser(null);
  }

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return <ChatPage user={user} onLogout={handleLogout} />;
}

export default App;
