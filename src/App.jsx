import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getDatabase,
  ref,
  set,
  get,
  onValue
} from "firebase/database";
import { firebaseConfig } from "./firebaseConfig";
import "./App.css";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userBalance, setUserBalance] = useState(0);
  const [selectedBox, setSelectedBox] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [fastOpening, setFastOpening] = useState(false);
  const [unboxResult, setUnboxResult] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const boxes = [
    {
      id: 1,
      name: "STARTER",
      price: 0.11,
      image: "📦",
      rewards: ["🎮", "⚔️", "🛡️", "💎", "🪙", "🧪", "📜", "🔮", "👑", "🏆"]
    },
    {
      id: 2,
      name: "PREMIUM",
      price: 0.25,
      image: "💎",
      rewards: ["💎", "👑", "🏆", "⚡", "🔥", "💫", "🌟", "✨", "🎯", "🚀"]
    },
    {
      id: 3,
      name: "LEGENDARY",
      price: 0.50,
      image: "🎁",
      rewards: ["🏆", "👑", "💎", "🔥", "⚡", "💫", "🌟", "✨", "🎯", "🚀"]
    }
  ];

  // Database functions
  const createUserProfile = async (user) => {
    const userRef = ref(db, `users/${user.uid}`);
    const userSnap = await get(userRef);

    if (!userSnap.exists()) {
      await set(userRef, {
        email: user.email,
        balance: 0,
        createdAt: new Date().toISOString()
      });
    }
  };

  const updateUserBalance = async (newBalance) => {
    if (user) {
      const userBalanceRef = ref(db, `users/${user.uid}/balance`);
      await set(userBalanceRef, newBalance);
    }
  };

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        createUserProfile(u);
        // Listen to user balance changes
        const userBalanceRef = ref(db, `users/${u.uid}/balance`);
        const unsubscribe = onValue(userBalanceRef, (snapshot) => {
          if (snapshot.exists()) {
            setUserBalance(snapshot.val() || 0);
          }
        });

        return () => unsubscribe();
      }
    });

    // Set default selected box
    setSelectedBox(boxes[0]);
  }, []);

  const handleAddFunds = () => {
    const newBalance = userBalance + 1.00;
    updateUserBalance(newBalance);
  };

  const handleUnboxing = async (box) => {
    if (userBalance >= box.price) {
      setIsSpinning(true);
      setUnboxResult(null);

      const newBalance = userBalance - box.price;
      await updateUserBalance(newBalance);

      const spinDuration = fastOpening ? 1000 : 3000;

      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * box.rewards.length);
        const reward = box.rewards[randomIndex];
        setUnboxResult(reward);
        setIsSpinning(false);
      }, spinDuration);
    }
  };

  const handleDemoSpin = () => {
    setIsSpinning(true);
    setUnboxResult(null);

    const spinDuration = fastOpening ? 1000 : 3000;

    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * selectedBox.rewards.length);
      const reward = selectedBox.rewards[randomIndex];
      setUnboxResult(reward);
      setIsSpinning(false);
    }, spinDuration);
  };

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">Welcome to GrowDice</h2>
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
    <div className="unboxing-app">
      {/* Header */}
      <header className="unbox-header">
        <div className="logo">
          <span className="logo-g">G</span>
          <span>🎲</span>
          <span className="logo-d">D</span>
        </div>
        <div className="balance-section">
          <div className="balance-display">
            <img src="/IMG_1858.webp" alt="balance" className="balance-icon" />
            <span>{userBalance.toFixed(2)}</span>
          </div>
          <button className="add-funds-btn" onClick={handleAddFunds}>
            <img src="/IMG_1859.png" alt="wallet" className="wallet-icon" />
          </button>
        </div>
        <div className="profile-section">
          <button 
            className="profile-btn" 
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            👤
          </button>
          {showProfileDropdown && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-item" onClick={() => signOut(auth)}>
                <span>🚪</span>
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="unbox-main">
        {/* Box Selection */}
        <div className="box-selector">
          {boxes.map(box => (
            <button
              key={box.id}
              className={`box-select-btn ${selectedBox?.id === box.id ? 'active' : ''}`}
              onClick={() => setSelectedBox(box)}
            >
              {box.image} {box.name}
            </button>
          ))}
        </div>

        {/* Box Display */}
        <div className="box-display">
          <div className={`box-container ${isSpinning ? 'spinning' : ''}`}>
            {isSpinning ? (
              <div className="spinning-emoji">
                {selectedBox.rewards.map((emoji, index) => (
                  <span key={index} className="spin-emoji" style={{animationDelay: `${index * 0.1}s`}}>
                    {emoji}
                  </span>
                ))}
              </div>
            ) : unboxResult ? (
              <div className="result-emoji">{unboxResult}</div>
            ) : (
              <div className="box-emoji">{selectedBox?.image}</div>
            )}
          </div>
        </div>

        {/* Box Info */}
        <div className="box-info">
          <h2 className="box-title">{selectedBox?.name}</h2>

          <div className="box-actions">
            <button 
              className={`open-btn ${userBalance < selectedBox?.price ? 'disabled' : ''}`}
              onClick={() => handleUnboxing(selectedBox)}
              disabled={userBalance < selectedBox?.price || isSpinning}
            >
              <span>Open for {selectedBox?.price}</span>
              <img src="/IMG_1858.webp" alt="balance" className="btn-icon" />
            </button>

            <button 
              className="demo-btn"
              onClick={handleDemoSpin}
              disabled={isSpinning}
            >
              Demo Spin
            </button>
          </div>

          <label className="fast-opening">
            <input
              type="checkbox"
              checked={fastOpening}
              onChange={(e) => setFastOpening(e.target.checked)}
            />
            <span>Fast Opening</span>
          </label>

          <div className="box-features">
            <div className="feature">
              <span>🛡️</span>
              <span>Provably Fair</span>
            </div>
            <div className="feature">
              <span>⚙️</span>
              <span>Settings</span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button className="nav-btn">💬</button>
        <button className="nav-btn">💰</button>
        <button className="nav-btn">☰</button>
      </nav>
    </div>
  );
}