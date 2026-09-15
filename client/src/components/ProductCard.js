import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StarRating from './StarRating';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function ProductCard({ product }) {
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { isInWishlist, toggle } = useWishlist();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);

  const price = parseFloat(product.price);
  const hasDiscount = product.discount_pct > 0;
  const finalPrice = hasDiscount ? +(price * (1 - product.discount_pct / 100)).toFixed(2) : price;
  const inWishlist = isInWishlist(product.id);
  const outOfStock = product.stock <= 0;

  async function handleAddToCart(e) {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/products' } });
      return;
    }
    setAdding(true);
    try {
      await addItem(product.id, 1);
    } catch (err) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleToggleWishlist(e) {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/products' } });
      return;
    }
    try {
      await toggle(product.id);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <button
        className={`wishlist-heart ${inWishlist ? 'active' : ''}`}
        onClick={handleToggleWishlist}
        aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        type="button"
      >
        {inWishlist ? '❤️' : '🤍'}
      </button>

      <div className="img-wrap">{product.name.charAt(0)}</div>

      <div className="body">
        <h3>{product.name}</h3>
        <StarRating rating={product.avg_rating} reviewCount={product.review_count} />
        <div className="price">
          ${finalPrice.toFixed(2)}
          {hasDiscount && <span className="old-price">${price.toFixed(2)}</span>}
        </div>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={handleAddToCart}
          disabled={adding || outOfStock}
        >
          {outOfStock ? 'Out of Stock' : adding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  );
}
