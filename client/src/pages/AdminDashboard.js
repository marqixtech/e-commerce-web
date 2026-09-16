import React from 'react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '700px', margin: '0 auto' }}>
      <h2>Admin Dashboard</h2>
      <p style={{ color: '#777' }}>Manage products and orders for MARQIX SHOPPING MALL.</p>

      <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: '1fr 1fr', marginTop: '20px' }}>
        <Link to="/admin/products" className="cart-summary" style={{ textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 6px' }}>📦 Products</h3>
          <p style={{ margin: 0, color: '#777', fontSize: '0.85rem' }}>Add, edit, or remove products</p>
        </Link>
        <Link to="/admin/orders" className="cart-summary" style={{ textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 6px' }}>🧾 Orders</h3>
          <p style={{ margin: 0, color: '#777', fontSize: '0.85rem' }}>View all orders and update status</p>
        </Link>
      </div>
    </div>
  );
}
