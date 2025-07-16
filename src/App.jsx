import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { firebaseConfig } from "./firebaseConfig";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("home"); // home, wallet, chat, profile
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
  }, []);

  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Login / Register</h2>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginBottom: 10, display: "block" }}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginBottom: 10, display: "block" }}
        />
        <button
          onClick={() => createUserWithEmailAndPassword(auth, email, password)}
          style={{ marginRight: 10 }}
        >
          Register
        </button>
        <button onClick={() => signInWithEmailAndPassword(auth, email, password)}>
          Login
        </button>
      </div>
    );
  }

  return (
    <div>
      <nav
        style={{
          display: "flex",
          justifyContent: "space-around",
          position: "fixed",
          bottom: 0,
          width: "100%",
          borderTop: "1px solid #ccc",
          backgroundColor: "#eee",
          padding: 10,
        }}
      >
        <button onClick={() => setPage("home")}>🏠 Home</button>
        <button onClick={() => setPage("wallet")}>👛 Wallet</button>
        <button onClick={() => setPage("chat")}>💬 Chat</button>
        <button onClick={() => setPage("profile")}>👤 Profile</button>
      </nav>

      <div style={{ paddingBottom: 60, paddingTop: 20 }}>
        {page === "home" && <HomePage />}
        {page === "wallet" && <WalletPage />}
        {page === "chat" && <ChatPage />}
        {page === "profile" && <ProfilePage user={user} />}
      </div>

      <button
        onClick={() => signOut(auth)}
        style={{ position: "fixed", top: 10, right: 10 }}
      >
        Logout
      </button>
    </div>
  );
}

function HomePage() {
  return <h2>Home - Product list and search will go here</h2>;
}

function WalletPage() {
  return <h2>Wallet - Show balance & recharge will go here</h2>;
}

function ChatPage() {
  return <h2>Public Chat - realtime messages will go here</h2>;
}

function ProfilePage({ user }) {
  return (
    <div>
      <h2>Profile</h2>
      <p>Email: {user.email}</p>
      {/* Purchase history will go here */}
    </div>
  );
}

