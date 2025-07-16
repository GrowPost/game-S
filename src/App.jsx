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
  const [products, setProducts] = useState([]);
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

  const addProduct = async (product) => {
    const productRef = ref(db, `products/${product.id}`);
    await set(productRef, product);
  };

  const deleteProduct = async (productId) => {
    const productRef = ref(db, `products/${productId}`);
    await set(productRef, null);
  };

  const addPurchasedProduct = async (userId, productId, code) => {
    const purchaseRef = ref(db, `users/${userId}/purchases/${productId}`);
    await set(purchaseRef, {
      productId,
      code,
      purchaseDate: new Date().toISOString()
    });
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

    // Load products from database
    const productsRef = ref(db, 'products');
    onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const productsData = snapshot.val();
        const productsArray = Object.values(productsData);
        setProducts(productsArray);
      } else {
        defaultProducts.forEach(product => addProduct(product));
      }
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
        {page === "home" && <HomePage products={products} userBalance={userBalance} updateUserBalance={updateUserBalance} user={user} addPurchasedProduct={addPurchasedProduct} />}
        {page === "wallet" && <WalletPage balance={userBalance} updateUserBalance={updateUserBalance} />}
        {page === "chat" && <ChatPage user={user} />}
        {page === "admin" && isAdmin && <AdminPage products={products} addProduct={addProduct} deleteProduct={deleteProduct} />}
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

function HomePage({ products, userBalance, updateUserBalance, user, addPurchasedProduct }) {
  const handlePurchase = async (product) => {
    if (userBalance >= product.price) {
      const newBalance = userBalance - product.price;
      await updateUserBalance(newBalance);
      await addPurchasedProduct(user.uid, product.id, product.code);
      alert(`Successfully purchased ${product.name}!\n\nYour activation code: ${product.code}\n\nThis code has been saved to your profile.`);
    } else {
      alert("Insufficient balance! Please add funds to your wallet.");
    }
  };

  return (
    <div className="page-card">
      <h1 className="page-title">Game Store</h1>

      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <div className="product-image">{product.image}</div>
            <h3 className="product-name">{product.name}</h3>
            <p className="product-category">{product.category}</p>
            <div className="product-price">${product.price}</div>
            <button 
              className={`buy-btn ${userBalance < product.price ? 'disabled' : ''}`}
              onClick={() => handlePurchase(product)}
              disabled={userBalance < product.price}
            >
              {userBalance >= product.price ? 'Buy Now' : 'Insufficient Funds'}
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

function AdminPage({ products, addProduct, deleteProduct }) {
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    image: '🎮',
    category: '',
    code: ''
  });

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      if (i === 4 || i === 8) result += '-';
      else result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleAddProduct = async () => {
    if (newProduct.name && newProduct.price && newProduct.category && newProduct.code) {
      const product = {
        id: Date.now(),
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        image: newProduct.image,
        category: newProduct.category,
        code: newProduct.code
      };
      await addProduct(product);
      setNewProduct({ name: '', price: '', image: '🎮', category: '', code: '' });
      alert('Product added successfully!');
    } else {
      alert('Please fill in all fields including the activation code');
    }
  };

  const handleDeleteProduct = async (id) => {
    await deleteProduct(id);
    alert('Product deleted successfully!');
  };

  return (
    <div className="page-card">
      <h1 className="page-title">Admin Panel</h1>

      <div className="admin-section">
        <h2>Add New Product</h2>
        <div className="admin-form">
          <input
            type="text"
            placeholder="Product Name"
            value={newProduct.name}
            onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
            className="admin-input"
          />
          <input
            type="number"
            placeholder="Price"
            value={newProduct.price}
            onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
            className="admin-input"
          />
          <input
            type="text"
            placeholder="Category"
            value={newProduct.category}
            onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
            className="admin-input"
          />
          <div className="code-input-group">
            <input
              type="text"
              placeholder="Activation Code"
              value={newProduct.code}
              onChange={(e) => setNewProduct({...newProduct, code: e.target.value})}
              className="admin-input"
            />
            <button 
              type="button"
              className="generate-code-btn"
              onClick={() => setNewProduct({...newProduct, code: generateRandomCode()})}
            >
              Generate
            </button>
          </div>
          <select 
            value={newProduct.image}
            onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
            className="admin-input"
          >
            <option value="🎮">🎮</option>
            <option value="⚔️">⚔️</option>
            <option value="⚽">⚽</option>
            <option value="🧱">🧱</option>
            <option value="🏎️">🏎️</option>
            <option value="👾">👾</option>
          </select>
          <button className="admin-btn" onClick={handleAddProduct}>Add Product</button>
        </div>
      </div>

      <div className="admin-section">
        <h2>Manage Products</h2>
        <div className="admin-products">
          {products.map(product => (
            <div key={product.id} className="admin-product-card">
              <span>{product.image} {product.name} - ${product.price}</span>
              <button 
                className="delete-btn"
                onClick={() => handleDeleteProduct(product.id)}
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