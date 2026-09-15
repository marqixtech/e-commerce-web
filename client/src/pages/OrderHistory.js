import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../services/orderService';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyOrders()
      .then((res) => setOrders(res.data.orders))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-text">Loading your orders...</div>;
  if (error) return <div className="error-banner">{error}</div>;

  if (orders.length === 0) {
    return (
      <div className="empty-state">
        <h2>📦 No orders yet</h2>
        <p>Your order history will show up here once you place an order.</p>
        <Link to="/products" className="btn btn-primary">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <h2>My Orders</h2>
      {orders.map((order) => (
        <Link key={order.id} to={`/orders/${order.id}`} className="order-card" style={{ display: 'block' }}>
          <div className="order-head">
            <strong>Order #{order.id.slice(0, 8)}</strong>
            <span className={`status-badge status-${order.status}`}>{order.status}</span>
          </div>
          <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#777' }}>
            Placed on {new Date(order.created_at).toLocaleDateString()}
          </p>
          <p style={{ margin: 0, fontWeight: 700 }}>${parseFloat(order.total_amount).toFixed(2)}</p>
        </Link>
      ))}
    </div>
  );
}
