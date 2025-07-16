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
import "./App.css";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("home");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
  }, []);

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">Welcome Back</h2>
          <input
            className="auth-input"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="auth-input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="auth-buttons">
            <button
              className="btn-secondary"
              onClick={() => createUserWithEmailAndPassword(auth, email, password)}
            >
              Register
            </button>
            <button
              className="btn-primary"
              onClick={() => signInWithEmailAndPassword(auth, email, password)}
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <header className="header">
        <div className="logo">GameStore</div>
        <button className="logout-btn" onClick={() => signOut(auth)}>
          Logout
        </button>
      </header>

      <div className="content">
        {page === "home" && <HomePage />}
        {page === "wallet" && <WalletPage />}
        {page === "chat" && <ChatPage />}
        {page === "profile" && <ProfilePage user={user} />}
      </div>

      <nav className="nav-bar">
        <div className="nav-buttons">
          <button 
            className={`nav-btn ${page === "home" ? "active" : ""}`}
            onClick={() => setPage("home")}
          >
            🏠 Home
          </button>
          <button 
            className={`nav-btn ${page === "wallet" ? "active" : ""}`}
            onClick={() => setPage("wallet")}
          >
            👛 Wallet
          </button>
          <button 
            className={`nav-btn ${page === "chat" ? "active" : ""}`}
            onClick={() => setPage("chat")}
          >
            💬 Chat
          </button>
          <button 
            className={`nav-btn ${page === "profile" ? "active" : ""}`}
            onClick={() => setPage("profile")}
          >
            👤 Profile
          </button>
        </div>
      </nav>
    </div>
  );
}

function HomePage() {
  return (
    <div className="page-card">
      <h1 className="page-title">Discover Games</h1>
      <p style={{ fontSize: "1.1rem", color: "#666", marginBottom: "30px" }}>
        Find your next favorite game from our collection
      </p>
      
      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon">🎮</div>
          <h3>Action Games</h3>
          <p>Fast-paced adventures and thrilling combat experiences</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🧩</div>
          <h3>Puzzle Games</h3>
          <p>Challenge your mind with brain-teasing puzzles</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🏆</div>
          <h3>Strategy Games</h3>
          <p>Plan, build, and conquer in strategic gameplay</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">👥</div>
          <h3>Multiplayer</h3>
          <p>Connect and compete with players worldwide</p>
        </div>
      </div>
    </div>
  );
}

function WalletPage() {
  const [balance] = useState(125.50);
  
  return (
    <div className="page-card">
      <h1 className="page-title">My Wallet</h1>
      
      <div className="wallet-balance">
        <div className="balance-amount">${balance.toFixed(2)}</div>
        <p>Available Balance</p>
        <button className="recharge-btn">Add Funds</button>
      </div>
      
      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon">💳</div>
          <h3>Payment Methods</h3>
          <p>Manage your cards and payment options</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Transaction History</h3>
          <p>View your purchase and recharge history</p>
        </div>
      </div>
    </div>
  );
}

function ChatPage() {
  return (
    <div className="page-card">
      <h1 className="page-title">Community Chat</h1>
      <p style={{ fontSize: "1.1rem", color: "#666", marginBottom: "30px" }}>
        Connect with fellow gamers
      </p>
      
      <div style={{ 
        background: "rgba(102, 126, 234, 0.1)", 
        borderRadius: "15px", 
        padding: "30px", 
        textAlign: "center",
        border: "2px dashed #667eea"
      }}>
        <div style={{ fontSize: "3rem", marginBottom: "15px" }}>💬</div>
        <h3>Chat Coming Soon</h3>
        <p>Real-time messaging with the gaming community will be available here</p>
      </div>
    </div>
  );
}

function ProfilePage({ user }) {
  const getInitial = (email) => email.charAt(0).toUpperCase();
  
  return (
    <div className="page-card">
      <h1 className="page-title">My Profile</h1>
      
      <div className="profile-info">
        <div className="profile-avatar">
          {getInitial(user.email)}
        </div>
        <div className="profile-details">
          <h3>Welcome back!</h3>
          <p>{user.email}</p>
        </div>
      </div>
      
      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon">🛍️</div>
          <h3>Purchase History</h3>
          <p>View your game library and past purchases</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⚙️</div>
          <h3>Account Settings</h3>
          <p>Manage your preferences and security</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🏅</div>
          <h3>Achievements</h3>
          <p>Track your gaming milestones and badges</p>
        </div>
      </div>
    </div>
  );
}

