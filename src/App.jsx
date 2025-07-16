import React, { useEffect, useState } from "react";
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
  const [userBalance, setUserBalance] = useState(125.50);
  const [products, setProducts] = useState([
    { id: 1, name: "Call of Duty: Modern Warfare", price: 59.99, image: "🎮", category: "Action" },
    { id: 2, name: "The Legend of Zelda", price: 49.99, image: "⚔️", category: "Adventure" },
    { id: 3, name: "FIFA 2024", price: 39.99, image: "⚽", category: "Sports" },
    { id: 4, name: "Minecraft", price: 26.95, image: "🧱", category: "Sandbox" }
  ]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Database functions
  const createUserProfile = async (user) => {
    const userRef = ref(db, `users/${user.uid}`);
    const userSnap = await get(userRef);

    if (!userSnap.exists()) {
      await set(userRef, {
        email: user.email,
        balance: 125.50,
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
        {page === "home" && <HomePage products={products} userBalance={userBalance} setUserBalance={setUserBalance} updateUserBalance={updateUserBalance} />}
        {page === "wallet" && <WalletPage balance={userBalance} setBalance={setUserBalance} updateUserBalance={updateUserBalance} />}
        {page === "chat" && <ChatPage />}
        {page === "admin" && isAdmin && <AdminPage products={products} setProducts={setProducts} />}
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
          {isAdmin && (
            <button 
              className={`nav-btn ${page === "admin" ? "active" : ""}`}
              onClick={() => setPage("admin")}
            >
              👑 Admin
            </button>
          )}
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

function HomePage({ products, userBalance, setUserBalance, updateUserBalance }) {
  const handlePurchase = (product) => {
    if (userBalance >= product.price) {
      const newBalance = userBalance - product.price;
      updateUserBalance(newBalance);
      alert(`Successfully purchased ${product.name}!`);
    } else {
      alert("Insufficient balance! Please add funds to your wallet.");
    }
  };

  return (
    <div className="page-card">
      <h1 className="page-title">Game Store</h1>
      <div className="balance-display">
        Your Balance: <span className="balance-amount">${userBalance.toFixed(2)}</span>
      </div>

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

function WalletPage({ balance, setBalance, updateUserBalance }) {
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
        <div className="add-funds-buttons">
          <button className="recharge-btn" onClick={() => handleAddFunds(10)}>Add $10</button>
          <button className="recharge-btn" onClick={() => handleAddFunds(25)}>Add $25</button>
          <button className="recharge-btn" onClick={() => handleAddFunds(50)}>Add $50</button>
        </div>
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

function AdminPage({ products, setProducts }) {
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    image: '🎮',
    category: ''
  });

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.price && newProduct.category) {
      const product = {
        id: Date.now(),
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        image: newProduct.image,
        category: newProduct.category
      };
      setProducts([...products, product]);
      setNewProduct({ name: '', price: '', image: '🎮', category: '' });
      alert('Product added successfully!');
    } else {
      alert('Please fill in all fields');
    }
  };

  const handleDeleteProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
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