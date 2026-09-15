import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Header() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItems } = useCart();

  function handleSearch(e) {
    e.preventDefault();
    navigate(query.trim() ? `/products?search=${encodeURIComponent(query.trim())}` : '/products');
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/">
          <h1>MARQIX <span style={{ color: '#e94560' }}>SHOPPING MALL</span></h1>
        </Link>

        <form className="search-bar" onSubmit={handleSearch} role="search">
          <input
            type="search"
            placeholder="Search products"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products"
          />
          <button type="submit">🔍</button>
        </form>

        <nav className="nav-links">
          <Link to="/products">Products</Link>
          <Link to="/wishlist">❤️ Wishlist</Link>
          <Link to="/cart">
            🛒 Cart{totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/orders">👤 {user?.full_name?.split(' ')[0] || 'Account'}</Link>
              <button onClick={logout}>Logout</button>
            </>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
