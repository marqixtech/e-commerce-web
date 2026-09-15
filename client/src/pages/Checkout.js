import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { checkout } from '../services/orderService';

export default function Checkout() {
  const { items, totalPrice, refreshCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [shippingName, setShippingName] = useState(user?.full_name || '');
  const [shippingPhone, setShippingPhone] = useState(user?.phone || '');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <h2>Your cart is empty</h2>
        <p>Add something to your cart before checking out.</p>
        <Link to="/products" className="btn btn-primary">Browse Products</Link>
      </div>
    );
  }

  async function handlePlaceOrder(e) {
    e.preventDefault();
    setError('');
    setPlacing(true);
    try {
      const res = await checkout({ shippingName, shippingPhone, shippingAddress, paymentMethod });
      await refreshCart(); // cart is now empty server-side
      navigate(`/orders/${res.data.order.id}`, { state: { justPlaced: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="checkout-page">
      <h2>Checkout</h2>

      <div className="cart-summary" style={{ marginBottom: '20px' }}>
        <h4 style={{ marginTop: 0 }}>Order Summary</h4>
        {items.map((item) => (
          <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
            <span>{item.name} × {item.quantity}</span>
            <span>${item.line_total.toFixed(2)}</span>
          </div>
        ))}
        <div className="total-row" style={{ marginTop: '10px', marginBottom: 0 }}>
          <span>Total</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="form-page" style={{ margin: 0 }}>
        {error && <p className="error-text">{error}</p>}

        <div className="form-group">
          <label htmlFor="shippingName">Full Name</label>
          <input
            id="shippingName"
            required
            value={shippingName}
            onChange={(e) => setShippingName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="shippingPhone">Phone Number</label>
          <input
            id="shippingPhone"
            required
            value={shippingPhone}
            onChange={(e) => setShippingPhone(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="shippingAddress">Delivery Address</label>
          <textarea
            id="shippingAddress"
            required
            rows={3}
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            placeholder="Street, city, state..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="paymentMethod">Payment Method</label>
          <select id="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="cash_on_delivery">Cash on Delivery</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
          <p style={{ fontSize: '0.8rem', color: '#777', marginTop: '6px' }}>
            Online card payment isn't wired up yet — Paystack can be added here later.
          </p>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={placing}>
          {placing ? 'Placing order...' : `Place Order — $${totalPrice.toFixed(2)}`}
        </button>
      </form>
    </div>
  );
}
