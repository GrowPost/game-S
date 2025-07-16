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
  const [betAmount, setBetAmount] = useState(0);
  const [isBetting, setIsBetting] = useState(false);
  const [betResult, setBetResult] = useState(null);

  const itemValues = {
    "🎮": 0.05,
    "⚔️": 0.08,
    "🛡️": 0.12,
    "💎": 0.25,
    "🪙": 0.03,
    "🧪": 0.15,
    "📜": 0.10,
    "🔮": 0.20,
    "👑": 0.50,
    "🏆": 0.75,
    "⚡": 0.30,
    "🔥": 0.35,
    "💫": 0.40,
    "🌟": 0.45,
    "✨": 0.22,
    "🎯": 0.18,
    "🚀": 0.60
  };

  const boxes = [
    {
      id: 1,
      name: "STARTER",
      price: 0.11,
      image: "💀",
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
      setBetResult(null);

      let newBalance = userBalance - box.price;
      
      // Deduct bet amount if betting
      if (isBetting && betAmount > 0) {
        newBalance -= betAmount;
      }
      
      await updateUserBalance(newBalance);

      const spinDuration = fastOpening ? 1000 : 3000;

      setTimeout(async () => {
        const randomIndex = Math.floor(Math.random() * box.rewards.length);
        const reward = box.rewards[randomIndex];
        const itemValue = itemValues[reward] || 0;
        
        // Add item value to balance
        let finalBalance = newBalance + itemValue;
        
        // Handle betting outcome
        if (isBetting && betAmount > 0) {
          const avgItemValue = box.rewards.reduce((sum, item) => sum + itemValues[item], 0) / box.rewards.length;
          const won = itemValue > avgItemValue;
          
          if (won) {
            finalBalance += betAmount * 2; // Double the bet
            setBetResult({ won: true, amount: betAmount * 2 });
          } else {
            setBetResult({ won: false, amount: betAmount });
          }
        }
        
        await updateUserBalance(finalBalance);
        
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
              <div className="result-container">
                <div className="result-emoji">{unboxResult}</div>
                <div className="result-value">+{itemValues[unboxResult]?.toFixed(2)}</div>
              </div>
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

          {/* Betting System */}
          <div className="betting-section">
            <h3 className="betting-title">Bet on High Value Item</h3>
            <div className="betting-controls">
              <label className="betting-toggle">
                <input
                  type="checkbox"
                  checked={isBetting}
                  onChange={(e) => setIsBetting(e.target.checked)}
                />
                <span>Enable Betting</span>
              </label>
              
              {isBetting && (
                <div className="bet-amount-section">
                  <input
                    type="number"
                    min="0"
                    max={userBalance}
                    step="0.01"
                    value={betAmount}
                    onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                    className="bet-input"
                    placeholder="Bet amount"
                  />
                  <div className="bet-info">
                    <span>Win if item value > average</span>
                    <span className="bet-multiplier">2x payout</span>
                  </div>
                </div>
              )}
            </div>
            
            {betResult && (
              <div className={`bet-result ${betResult.won ? 'win' : 'lose'}`}>
                {betResult.won ? 
                  `🎉 Bet Won! +${betResult.amount.toFixed(2)}` : 
                  `❌ Bet Lost! -${betResult.amount.toFixed(2)}`
                }
              </div>
            )}
          </div>

          {/* Item List with Values */}
          <div className="item-list">
            <h3 className="item-list-title">Possible Items:</h3>
            <div className="items-grid">
              {selectedBox?.rewards.map((item, index) => (
                <div key={index} className="item-card">
                  <span className="item-emoji">{item}</span>
                  <span className="item-value">{itemValues[item]?.toFixed(2)}</span>
                </div>
              ))}
            </div>
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
