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
  const [page, setPage] = useState("home");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userBalance, setUserBalance] = useState(0);
  const [boxes, setBoxes] = useState([]);
  const [userInventory, setUserInventory] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

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

  const addBox = async (box) => {
    const boxRef = ref(db, `boxes/${box.id}`);
    await set(boxRef, box);
  };

  const deleteBox = async (boxId) => {
    const boxRef = ref(db, `boxes/${boxId}`);
    await set(boxRef, null);
  };

  const addInventoryItem = async (userId, item) => {
    const inventoryRef = ref(db, `users/${userId}/inventory/${item.name}`);
    await set(inventoryRef, item);
  };

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      setUser(u);
      // Check if user is admin (you can modify this logic)
      if (u && u.email === "admin@gamestore.com") {
        setIsAdmin(true);
      }
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

    // Default boxes
    const defaultBoxes = [
      {
        id: 1,
        name: "Common Box",
        price: 10,
        image: "📦",
        rarity: "Common",
        rewards: [
          { name: "Steel Sword", emoji: "⚔️", rarity: "Common", value: 5 },
          { name: "Health Potion", emoji: "🧪", rarity: "Common", value: 3 },
          { name: "Gold Coins", emoji: "🪙", rarity: "Common", value: 8 },
          { name: "Magic Ring", emoji: "💍", rarity: "Rare", value: 15 },
        ]
      },
      {
        id: 2,
        name: "Rare Box",
        price: 25,
        image: "💎",
        rarity: "Rare",
        rewards: [
          { name: "Diamond Sword", emoji: "💎", rarity: "Epic", value: 50 },
          { name: "Legendary Shield", emoji: "🛡️", rarity: "Legendary", value: 100 },
          { name: "Phoenix Feather", emoji: "🪶", rarity: "Epic", value: 75 },
          { name: "Crystal Staff", emoji: "🔮", rarity: "Rare", value: 30 },
        ]
      },
      {
        id: 3,
        name: "Epic Box",
        price: 50,
        image: "🎁",
        rarity: "Epic",
        rewards: [
          { name: "Dragon Scale", emoji: "🐲", rarity: "Legendary", value: 200 },
          { name: "Mystic Orb", emoji: "🔮", rarity: "Epic", value: 150 },
          { name: "Crown of Kings", emoji: "👑", rarity: "Legendary", value: 300 },
          { name: "Void Crystal", emoji: "💜", rarity: "Mythic", value: 500 },
        ]
      }
    ];

    // Load boxes from database
    const boxesRef = ref(db, 'boxes');
    onValue(boxesRef, (snapshot) => {
      if (snapshot.exists()) {
        const boxesData = snapshot.val();
        const boxesArray = Object.values(boxesData);
        setBoxes(boxesArray);
      } else {
        defaultBoxes.forEach(box => addBox(box));
      }
    });

    // Load user inventory
    if (user) {
      const inventoryRef = ref(db, `users/${user.uid}/inventory`);
      onValue(inventoryRef, (snapshot) => {
        if (snapshot.exists()) {
          const inventoryData = snapshot.val();
          const inventoryArray = Object.values(inventoryData);
          setUserInventory(inventoryArray);
        } else {
          setUserInventory([]);
        }
      });
    }
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
        <div className="logo">
          <span className="logo-g">G</span>
          <span>🎲</span>
          <span className="logo-d">D</span>
        </div>
        <div className="wallet-section">
          <div className="balance-display-header">
            <img src="/IMG_1858.webp" alt="wallet" style={{width: '20px', height: '20px'}} />
            <span>${userBalance.toFixed(2)}</span>
          </div>
          <button className="wallet-btn" onClick={() => setPage("wallet")}>
            <img src="/IMG_1859.png" alt="wallet" style={{width: '20px', height: '20px'}} />
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
              <div className="profile-dropdown-item" onClick={() => { setPage("profile"); setShowProfileDropdown(false); }}>
                <span>👤</span>
                <span>Profile</span>
              </div>
              <div className="profile-dropdown-item" onClick={() => { signOut(auth); setShowProfileDropdown(false); }}>
                <span>🚪</span>
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="content">
        {page === "home" && <HomePage boxes={boxes} userBalance={userBalance} updateUserBalance={updateUserBalance} user={user} addInventoryItem={addInventoryItem} />}
        {page === "wallet" && <WalletPage balance={userBalance} updateUserBalance={updateUserBalance} />}
        {page === "chat" && <ChatPage user={user} />}
        {page === "admin" && isAdmin && <AdminPage boxes={boxes} addBox={addBox} deleteBox={deleteBox} />}
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
            className={`nav-btn ${page === "chat" ? "active" : ""}`}
            onClick={() => setPage("chat")}
          >
            💬 Chat
          </button>
          {isAdmin && (
            <button 
              className={`nav-btn ${page === "admin" ? "active" : ""}`}
              onClick={() => setPage("admin")}
            >
              👑 Admin
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}

function HomePage({ boxes, userBalance, updateUserBalance, user, addInventoryItem }) {
  const handleUnboxing = async (box) => {
    if (userBalance >= box.price) {
      const newBalance = userBalance - box.price;
      await updateUserBalance(newBalance);

      // Select a random reward from the box
      const randomIndex = Math.floor(Math.random() * box.rewards.length);
      const reward = box.rewards[randomIndex];

      // Add the reward to the user's inventory
      await addInventoryItem(user.uid, reward);

      alert(`Congratulations! You unboxed a ${reward.name} ${reward.emoji} from the ${box.name}!`);
    } else {
      alert("Insufficient balance! Please add funds to your wallet.");
    }
  };

  return (
    <div className="page-card">
      <h1 className="page-title">Unboxing</h1>

      <div className="products-grid">
        {boxes.map(box => (
          <div key={box.id} className="product-card">
            <div className="product-image">{box.image}</div>
            <h3 className="product-name">{box.name}</h3>
            <p className="product-category">{box.rarity}</p>
            <div className="product-price">${box.price}</div>
            <button 
              className={`buy-btn ${userBalance < box.price ? 'disabled' : ''}`}
              onClick={() => handleUnboxing(box)}
              disabled={userBalance < box.price}
            >
              {userBalance >= box.price ? 'Unbox Now' : 'Insufficient Funds'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function WalletPage({ balance, updateUserBalance }) {
  const handleAddFunds = (amount) => {
    const newBalance = balance + amount;
    updateUserBalance(newBalance);
    alert(`Successfully added $${amount} to your wallet!`);
  };

  return (
    <div className="page-card">
      <h1 className="page-title">My Wallet</h1>

      <div className="wallet-balance">
        <div className="balance-amount">${balance.toFixed(2)}</div>
        <p>Available Balance</p>
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

function ChatPage({ user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userProfiles, setUserProfiles] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(98);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Demo messages for initial display
  const demoMessages = [
    {
      id: 'demo1',
      type: 'system',
      timestamp: new Date().toISOString(),
      messages: ['Welcome to the game store chat! Connect with other gamers here.']
    }
  ];

  useEffect(() => {
    // Listen to chat messages from Firebase
    const messagesRef = ref(db, 'chat/messages');
    onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const messagesData = snapshot.val();
        const messagesArray = Object.entries(messagesData).map(([key, value]) => ({
          id: key,
          ...value,
          type: "user"
        })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setMessages(prev => [...demoMessages, ...messagesArray]);
      }
    });

    // Listen to user profiles
    const profilesRef = ref(db, 'userProfiles');
    onValue(profilesRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserProfiles(snapshot.val());
      }
    });

    // Track online users
    if (user) {
      const onlineRef = ref(db, `chat/online/${user.uid}`);
      const onlineUsersRef = ref(db, 'chat/online');

      // Set user as online
      set(onlineRef, {
        email: user.email,
        timestamp: new Date().toISOString()
      }).catch(error => {
        console.error("Error setting user online:", error);
      });

      // Listen to online users count
      const unsubscribeOnline = onValue(onlineUsersRef, (snapshot) => {
        if (snapshot.exists()) {
          const onlineData = snapshot.val();
          const now = new Date().getTime();
          const activeUsers = Object.values(onlineData).filter(userData => {
            const userTime = new Date(userData.timestamp).getTime();
            return (now - userTime) < 60000;
          });
          setOnlineUsers(Math.max(1, activeUsers.length));
        } else {
          setOnlineUsers(1);
        }
      }, (error) => {
        console.error("Error listening to online users:", error);
        setOnlineUsers(1);
      });

      // Update user activity every 30 seconds
      const activityInterval = setInterval(() => {
        set(onlineRef, {
          email: user.email,
          timestamp: new Date().toISOString()
        }).catch(error => {
          console.error("Error updating user activity:", error);
        });
      }, 30000);

      // Cleanup on unmount
      return () => {
        unsubscribeOnline();
        clearInterval(activityInterval);
        set(onlineRef, null).catch(error => {
          console.error("Error removing user from online list:", error);
        });
      };
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom()
  }, [messages]);

  const sendMessage = async () => {
    if (newMessage.trim() && user) {
      try {
        const messageRef = ref(db, `chat/messages/${Date.now()}`);
        await set(messageRef, {
          text: newMessage,
          userId: user.uid,
          userEmail: user.email,
          timestamp: new Date().toISOString()
        });
        setNewMessage('');
      } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message. Please try again.");
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getUserDisplayName = (userId, userEmail) => {
    const profile = userProfiles[userId];
    return profile?.displayName || userEmail.split('@')[0];
  };

  const getUserAvatar = (userId, userEmail) => {
    const profile = userProfiles[userId];
    return profile?.avatar || userEmail.charAt(0).toUpperCase();
  };

  const renderMessage = (message) => {
    if (message.type === "system") {
      return (
        <div key={message.id} className="system-message">
          <div className="system-header">
            SYSTEM
            <span className="system-time">{new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
          {message.messages.map((msg, index) => (
            <div key={index} className="system-content">
              <p dangerouslySetInnerHTML={{
                __html: msg.replace(/@(\w+)/g, '<span class="username-mention">@$1</span>')
              }} />
            </div>
          ))}
        </div>
      );
    }

    const isOwn = message.userId === user?.uid;
    const displayName = message.username || getUserDisplayName(message.userId, message.userEmail);
    const avatar = message.avatar || getUserAvatar(message.userId, message.userEmail);

    return (
      <div key={message.id} className={`message ${isOwn ? 'own-message' : ''}`}>
        <div className="message-avatar">
          {avatar}
        </div>
        <div className="message-content">
          <div className="message-header">
            <span className="message-author">{displayName}</span>
            {message.level && (
              <span className="user-level">LVL {message.level}</span>
            )}
            <span className="message-time">{new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
          <div className="message-text">{message.text}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <div className="chat-icon">💬</div>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form className="chat-input-form" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
          <input
            className="chat-input"
            placeholder="Say something"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button type="button" className="emoji-btn">
            😊
          </button>
        </form>

        <div className="chat-footer">
          <div className="online-status">
            <span className="online-dot">●</span>
            <span>{onlineUsers} <strong>online</strong></span>
          </div>
          <div className="chat-controls">
            <span>150</span>
            <button className="menu-btn">☰</button>
            <button 
              className="send-button"
              onClick={sendMessage}
              disabled={!newMessage.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminPage({ boxes, addBox, deleteBox }) {
  const [newBox, setNewBox] = useState({
    name: '',
    price: '',
    image: '📦',
    rarity: '',
    rewards: []
  });

  const handleAddBox = async () => {
    if (newBox.name && newBox.price && newBox.rarity) {
      const box = {
        id: Date.now(),
        name: newBox.name,
        price: parseFloat(newBox.price),
        image: newBox.image,
        rarity: newBox.rarity,
        rewards: [] // You can add a feature to add rewards here
      };
      await addBox(box);
      setNewBox({ name: '', price: '', image: '📦', rarity: '', rewards: [] });
      alert('Box added successfully!');
    } else {
      alert('Please fill in all fields');
    }
  };

  const handleDeleteBox = async (id) => {
    await deleteBox(id);
    alert('Box deleted successfully!');
  };

  return (
    <div className="page-card">
      <h1 className="page-title">Admin Panel</h1>

      <div className="admin-section">
        <h2>Add New Box</h2>
        <div className="admin-form">
          <input
            type="text"
            placeholder="Box Name"
            value={newBox.name}
            onChange={(e) => setNewBox({...newBox, name: e.target.value})}
            className="admin-input"
          />
          <input
            type="number"
            placeholder="Price"
            value={newBox.price}
            onChange={(e) => setNewBox({...newBox, price: e.target.value})}
            className="admin-input"
          />
          <input
            type="text"
            placeholder="Rarity"
            value={newBox.rarity}
            onChange={(e) => setNewBox({...newBox, rarity: e.target.value})}
            className="admin-input"
          />
          <select 
            value={newBox.image}
            onChange={(e) => setNewBox({...newBox, image: e.target.value})}
            className="admin-input"
          >
            <option value="📦">📦</option>
            <option value="💎">💎</option>
            <option value="🎁">🎁</option>
          </select>
          <button className="admin-btn" onClick={handleAddBox}>Add Box</button>
        </div>
      </div>

      <div className="admin-section">
        <h2>Manage Boxes</h2>
        <div className="admin-products">
          {boxes.map(box => (
            <div key={box.id} className="admin-product-card">
              <span>{box.image} {box.name} - ${box.price}</span>
              <button 
                className="delete-btn"
                onClick={() => handleDeleteBox(box.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfilePage({ user }) {
  const [purchases, setPurchases] = useState([]);
  const [profile, setProfile] = useState({ displayName: '', avatar: '', bio: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', avatar: '', bio: '' });

  const getInitial = (email) => email.charAt(0).toUpperCase();

  const avatarOptions = ['😀', '😎', '🤓', '🎮', '🎯', '⚡', '🔥', '💎', '🚀', '⭐'];

  useEffect(() => {
    if (user) {
      // Load purchases
      const purchasesRef = ref(db, `users/${user.uid}/purchases`);
      onValue(purchasesRef, (snapshot) => {
        if (snapshot.exists()) {
          const purchasesData = snapshot.val();
          const purchasesArray = Object.values(purchasesData);
          setPurchases(purchasesArray);
        } else {
          setPurchases([]);
        }
      });

      // Load user profile
      const profileRef = ref(db, `userProfiles/${user.uid}`);
      onValue(profileRef, (snapshot) => {
        if (snapshot.exists()) {
          const profileData = snapshot.val();
          setProfile(profileData);
          setEditForm(profileData);
        } else {
          // Create default profile
          const defaultProfile = {
            displayName: user.email.split('@')[0],
            avatar: getInitial(user.email),
            bio: 'Gaming enthusiast'
          };
          setProfile(defaultProfile);
          setEditForm(defaultProfile);
        }
      });
    }
  }, [user]);

  const saveProfile = async () => {
    if (user) {
      const profileRef = ref(db, `userProfiles/${user.uid}`);
      await set(profileRef, editForm);
      setIsEditing(false);
      alert('Profile updated successfully!');
    }
  };

  return (
    <div className="page-card">
      <h1 className="page-title">My Profile</h1>

      <div className="profile-info">
        <div className="profile-avatar">
          {profile.avatar}
        </div>
        <div className="profile-details">
          <h3>{profile.displayName}</h3>
          <p>{user.email}</p>
          <p className="profile-bio">{profile.bio}</p>
          <button 
            className="edit-profile-btn"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="edit-profile-section">
          <h3>Edit Profile</h3>
          <div className="edit-form">
            <div className="form-group">
              <label>Display Name:</label>
              <input
                type="text"
                value={editForm.displayName}
                onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                className="profile-input"
              />
            </div>

            <div className="form-group">
              <label>Avatar:</label>
              <div className="avatar-selection">
                {avatarOptions.map(avatar => (
                  <button
                    key={avatar}
                    className={`avatar-option ${editForm.avatar === avatar ? 'selected' : ''}`}
                    onClick={() => setEditForm({...editForm, avatar})}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Bio:</label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                className="profile-textarea"
                placeholder="Tell us about yourself..."
                rows="3"
              />
            </div>

            <button className="save-profile-btn" onClick={saveProfile}>
              Save Changes
            </button>
          </div>
        </div>
      )}

      {purchases.length > 0 && (
        <div className="purchases-section">
          <h2>My Purchase History</h2>
          <div className="purchases-list">
            {purchases.map((purchase, index) => (
              <div key={index} className="purchase-item">
                <div className="purchase-info">
                  <h4>Game Code: {purchase.code}</h4>
                  <p>Purchased: {new Date(purchase.purchaseDate).toLocaleDateString()}</p>
                </div>
                <button 
                  className="copy-code-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(purchase.code);
                    alert('Code copied to clipboard!');
                  }}
                >
                  Copy Code
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}