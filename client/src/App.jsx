import { useState } from "react";
import AuthPage from "./pages/AuthPage.jsx";

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

  return (
    <div>
      <p>Logged in as {user.username}</p>
      <button onClick={handleLogout}>Log out</button>
    </div>
  );
}

export default App;
