import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

export default function Wishlist() {
  const { items, loading, toggle } = useWishlist();
  const { addItem } = useCart();
  const [busyId, setBusyId] = useState(null);

  async function handleRemove(productId) {
    setBusyId(productId);
    try {
      await toggle(productId);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleAddToCart(productId) {
    setBusyId(productId);
    try {
      await addItem(productId, 1);
      alert('Added to cart!');
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="loading-text">Loading your wishlist...</div>;

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <h2>❤️ Your wishlist is empty</h2>
        <p>Save items you love for later!</p>
        <Link to="/products" className="btn btn-primary">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <h2>Wishlist ({items.length})</h2>

      {items.map((item) => (
        <div key={item.product_id} className="cart-item-row">
          <Link to={`/products/${item.product_id}`} className="img-wrap" style={{ display: 'block' }} />
          <div className="info">
            <Link to={`/products/${item.product_id}`}>
              <h4>{item.name}</h4>
            </Link>
            <p style={{ margin: '4px 0', fontWeight: 700 }}>${parseFloat(item.price).toFixed(2)}</p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: item.stock > 0 ? '#155724' : '#e94560' }}>
              {item.stock > 0 ? 'In stock' : 'Out of stock'}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
            <button
              className="btn btn-primary"
              onClick={() => handleAddToCart(item.product_id)}
              disabled={busyId === item.product_id || item.stock <= 0}
            >
              Add to Cart
            </button>
            <button
              onClick={() => handleRemove(item.product_id)}
              disabled={busyId === item.product_id}
              style={{ background: 'none', border: 'none', color: '#e94560', fontSize: '0.8rem' }}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
