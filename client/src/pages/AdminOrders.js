import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAllOrdersAdmin, updateOrderStatusAdmin } from '../services/adminService';

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllOrdersAdmin();
      setOrders(res.data.orders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function handleStatusChange(orderId, newStatus) {
    setUpdatingId(orderId);
    try {
      await updateOrderStatusAdmin(orderId, { status: newStatus, note: `Status updated to ${newStatus}` });
      await loadOrders();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) return <div className="loading-text">Loading all orders...</div>;
  if (error) return <div className="error-banner">{error}</div>;

  return (
    <div className="container" style={{ padding: '16px', maxWidth: '1000px', margin: '0 auto' }}>
      <Link to="/admin" style={{ fontSize: '0.85rem' }}>← Back to Dashboard</Link>
      <h2>Manage Orders ({orders.length})</h2>

      {orders.length === 0 ? (
        <p style={{ color: '#777' }}>No orders have been placed yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '10px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#1a1a2e', color: '#fff', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Order</th>
                <th style={{ padding: '10px' }}>Customer</th>
                <th style={{ padding: '10px' }}>Total</th>
                <th style={{ padding: '10px' }}>Placed</th>
                <th style={{ padding: '10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>
                    <Link to={`/orders/${order.id}`}>#{order.id.slice(0, 8)}</Link>
                  </td>
                  <td style={{ padding: '10px' }}>
                    {order.customer_name}
                    <br />
                    <span style={{ fontSize: '0.8rem', color: '#777' }}>{order.customer_email}</span>
                  </td>
                  <td style={{ padding: '10px' }}>${parseFloat(order.total_amount).toFixed(2)}</td>
                  <td style={{ padding: '10px', fontSize: '0.85rem' }}>
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <select
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className={`status-badge status-${order.status}`}
                      style={{ border: 'none', fontWeight: 700 }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
