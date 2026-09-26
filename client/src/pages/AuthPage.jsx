import { useState } from "react";
import { loginUser, registerUser } from "../api";

// one page for both login and register, the user can switch between them
function AuthPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      let data;
      if (isRegister) {
        data = await registerUser(username, password);
      } else {
        data = await loginUser(username, password);
      }

      // data has the token and the username
      onLogin(data);
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  }

  function switchMode() {
    setIsRegister(!isRegister);
    setError("");
  }

  return (
    <div className="auth-page">
      <form className="auth-box" onSubmit={handleSubmit}>
        <h1>Chat Room</h1>
        <h2>{isRegister ? "Create an account" : "Log in"}</h2>

        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {isRegister ? "Register" : "Log in"}
        </button>

        <p className="switch-text">
          {isRegister ? "Already have an account?" : "New here?"}{" "}
          <button type="button" className="link-button" onClick={switchMode}>
            {isRegister ? "Log in" : "Register"}
          </button>
        </p>
      </form>
    </div>
  );
}

export default AuthPage;
