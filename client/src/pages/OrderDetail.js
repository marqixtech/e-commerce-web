import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { getOrderById } from '../services/orderService';

const STATUS_STEPS = ['pending', 'processing', 'shipped', 'delivered'];

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getOrderById(id)
      .then((res) => {
        setOrder(res.data.order);
        setItems(res.data.items);
        setStatusHistory(res.data.statusHistory);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-text">Loading order...</div>;
  if (error) return <div className="error-banner">{error}</div>;
  if (!order) return null;

  const isCancelled = order.status === 'cancelled';
  const currentStepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="orders-page">
      {location.state?.justPlaced && (
        <div className="cart-summary" style={{ background: '#d4edda', color: '#155724', marginBottom: '16px' }}>
          🎉 Your order has been placed successfully!
        </div>
      )}

      <Link to="/orders" style={{ fontSize: '0.85rem' }}>← Back to Orders</Link>

      <div className="order-card" style={{ marginTop: '12px' }}>
        <div className="order-head">
          <h3 style={{ margin: 0 }}>Order #{order.id.slice(0, 8)}</h3>
          <span className={`status-badge status-${order.status}`}>{order.status}</span>
        </div>
        <p style={{ color: '#777', fontSize: '0.85rem' }}>
          Placed on {new Date(order.created_at).toLocaleString()}
        </p>

        {/* Simple step tracker (skipped for cancelled orders) */}
        {!isCancelled && (
          <div style={{ display: 'flex', margin: '20px 0', gap: '4px' }}>
            {STATUS_STEPS.map((step, i) => (
              <div key={step} style={{ flex: 1, textAlign: 'center' }}>
                <div
                  style={{
                    height: '6px',
                    borderRadius: '3px',
                    background: i <= currentStepIndex ? '#e94560' : '#eee',
                    marginBottom: '6px',
                  }}
                />
                <span style={{ fontSize: '0.7rem', textTransform: 'capitalize', color: i <= currentStepIndex ? '#222' : '#aaa' }}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        )}

        <h4>Items</h4>
        {items.map((item) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
            <span>{item.product_name} × {item.quantity}</span>
            <span>${(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="total-row" style={{ marginTop: '10px' }}>
          <span>Total</span>
          <span>${parseFloat(order.total_amount).toFixed(2)}</span>
        </div>

        <h4>Shipping To</h4>
        <p style={{ fontSize: '0.9rem', margin: 0 }}>
          {order.shipping_name}<br />
          {order.shipping_phone}<br />
          {order.shipping_address}
        </p>

        <h4>Tracking Timeline</h4>
        <ul className="tracking-timeline">
          {statusHistory.map((entry, i) => (
            <li key={i}>
              <strong style={{ textTransform: 'capitalize' }}>{entry.status}</strong>
              {entry.note && ` — ${entry.note}`}
              <br />
              <span style={{ color: '#777', fontSize: '0.8rem' }}>
                {new Date(entry.created_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
