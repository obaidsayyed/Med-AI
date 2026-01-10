import { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "./firebase"; // ✅ REQUIRED

export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("home");
  const [authMode, setAuthMode] = useState("login");
  const [error, setError] = useState("");

  /* ---------- AUTH HANDLER ---------- */
  async function handleAuth(e) {
    e.preventDefault();
    setError("");

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      let userCredential;

      if (authMode === "signup") {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
      } else {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
      }

      // ✅ SUCCESS
      setUser(userCredential.user);
      setScreen("home");
    } catch (err) {
      // ❌ ERROR
      setError(err.message);
    }
  }

  function logout() {
    setUser(null);
    setAuthMode("login");
  }

  return (
    <>
      <style>{css}</style>

      <div className="app">
        <header className="topbar">
          <h1>Med-AI</h1>
          {user && (
            <button className="logout" onClick={logout}>
              Logout
            </button>
          )}
        </header>

        <main className="main">
          {/* AUTH */}
          {!user && (
            <section className="auth">
              <h2>
                {authMode === "login"
                  ? "Login to Med-AI"
                  : "Create your Med-AI account"}
              </h2>

              <form onSubmit={handleAuth}>
                <input name="email" type="email" placeholder="Email" required />
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  required
                />
                <button type="submit">
                  {authMode === "login" ? "Login" : "Create Account"}
                </button>
              </form>

              {error && <p className="error">{error}</p>}

              <p className="auth-switch">
                {authMode === "login" ? (
                  <>
                    New here?{" "}
                    <span onClick={() => setAuthMode("signup")}>
                      Create an account
                    </span>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <span onClick={() => setAuthMode("login")}>
                      Login instead
                    </span>
                  </>
                )}
              </p>
            </section>
          )}

          {/* HOME */}
          {user && screen === "home" && (
            <section className="hero">
              <div>
                <h2>Welcome, {user.email}</h2>
                <p>
                  Med-AI uses AI and clinical reasoning to analyze symptoms.
                </p>
                <button onClick={() => setScreen("symptoms")}>
                  Start Symptom Check
                </button>
              </div>
              <div className="brain">🧠</div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}

/* ---------- CSS ADDITION ---------- */
const css = `
.error {
  color: #dc2626;
  font-size: 14px;
  margin-top: 10px;
}
`;
