import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { items, totalItems, totalPrice, loading, updateItem, removeItem, clear } = useCart();
  const [busyId, setBusyId] = useState(null);
  const navigate = useNavigate();

  async function handleQuantityChange(productId, newQty) {
    if (newQty < 1) return;
    setBusyId(productId);
    try {
      await updateItem(productId, newQty);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(productId) {
    setBusyId(productId);
    try {
      await removeItem(productId);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleClear() {
    if (!window.confirm('Clear your entire cart?')) return;
    try {
      await clear();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <div className="loading-text">Loading your cart...</div>;

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <h2>🛒 Your cart is empty</h2>
        <p>Browse our products and add something you like!</p>
        <Link to="/products" className="btn btn-primary">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h2>Shopping Cart ({totalItems} item{totalItems !== 1 ? 's' : ''})</h2>

      {items.map((item) => (
        <div key={item.product_id} className="cart-item-row">
          <div className="img-wrap" />
          <div className="info">
            <h4>{item.name}</h4>
            <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#777' }}>
              ${item.unit_price.toFixed(2)} each
            </p>
            <div className="qty-selector" style={{ margin: '6px 0' }}>
              <button
                onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                disabled={busyId === item.product_id || item.quantity <= 1}
              >
                -
              </button>
              <span>{item.quantity}</span>
              <button
                onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                disabled={busyId === item.product_id || item.quantity >= item.stock}
              >
                +
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontWeight: 700 }}>${item.line_total.toFixed(2)}</p>
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

      <div className="cart-summary">
        <div className="total-row">
          <span>Total</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
        <button className="btn btn-primary btn-block" onClick={() => navigate('/checkout')}>
          Proceed to Checkout
        </button>
        <button
          onClick={handleClear}
          style={{ background: 'none', border: 'none', color: '#777', fontSize: '0.8rem', marginTop: '10px', width: '100%' }}
        >
          Clear Cart
        </button>
      </div>
    </div>
  );
}
