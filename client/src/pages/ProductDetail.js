import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import StarRating from '../components/StarRating';
import { getProductById } from '../services/productService';
import { getProductReviews, submitReview, deleteReview } from '../services/reviewService';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addItem } = useCart();
  const { isInWishlist, toggle } = useWishlist();

  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const loadReviews = useCallback(async () => {
    const res = await getProductReviews(id);
    setReviews(res.data.reviews);
  }, [id]);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      setError('');
      try {
        const res = await getProductById(id);
        setProduct(res.data.product);
        setImages(res.data.images);
        setRelated(res.data.related);
        setActiveImage(0);
        setQuantity(1);
        await loadReviews();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id, loadReviews]);

  if (loading) return <div className="loading-text">Loading product...</div>;
  if (error) return <div className="error-banner">{error}</div>;
  if (!product) return null;

  const price = parseFloat(product.price);
  const hasDiscount = product.discount_pct > 0;
  const finalPrice = hasDiscount ? +(price * (1 - product.discount_pct / 100)).toFixed(2) : price;
  const inWishlist = isInWishlist(product.id);
  const outOfStock = product.stock <= 0;

  async function handleAddToCart() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    setAddingToCart(true);
    try {
      await addItem(product.id, quantity);
      alert('Added to cart!');
    } catch (err) {
      alert(err.message);
    } finally {
      setAddingToCart(false);
    }
  }

  async function handleToggleWishlist() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    await toggle(product.id);
  }

  async function handleSubmitReview(e) {
    e.preventDefault();
    setReviewError('');
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    setSubmittingReview(true);
    try {
      await submitReview(id, { rating: reviewRating, comment: reviewComment });
      setReviewComment('');
      await loadReviews();
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  }

  async function handleDeleteReview(reviewId) {
    if (!window.confirm('Delete your review?')) return;
    try {
      await deleteReview(id, reviewId);
      await loadReviews();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <div className="product-detail">
        {/* Gallery */}
        <div>
          <div className="gallery-main">
            {images.length > 0 ? (
              <img src={images[activeImage]?.image_url} alt={product.name} />
            ) : (
              <span>{product.name}</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="thumb-row">
              {images.map((img, i) => (
                <img
                  key={img.id}
                  src={img.image_url}
                  alt=""
                  onClick={() => setActiveImage(i)}
                  style={{ cursor: 'pointer', outline: i === activeImage ? '2px solid #e94560' : 'none' }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="product-info">
          <h2>{product.name}</h2>
          <StarRating rating={product.avg_rating} reviewCount={product.review_count} />

          <div className="price" style={{ fontSize: '1.4rem', margin: '10px 0' }}>
            ${finalPrice.toFixed(2)}
            {hasDiscount && <span className="old-price">${price.toFixed(2)}</span>}
          </div>

          <p>{product.description}</p>

          <p className={`stock-line ${product.stock < 5 && product.stock > 0 ? 'low' : ''}`}>
            {outOfStock
              ? '❌ Out of stock'
              : product.stock < 5
              ? `⚠️ Only ${product.stock} left in stock!`
              : `✅ In stock (${product.stock} available)`}
          </p>

          {product.brand && <p><strong>Brand:</strong> {product.brand}</p>}
          {product.category_name && <p><strong>Category:</strong> {product.category_name}</p>}

          {!outOfStock && (
            <div className="qty-selector">
              <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>-</button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}>+</button>
            </div>
          )}

          <div className="action-row">
            <button
              className="btn btn-primary"
              onClick={handleAddToCart}
              disabled={addingToCart || outOfStock}
            >
              {outOfStock ? 'Out of Stock' : addingToCart ? 'Adding...' : '🛒 Add to Cart'}
            </button>
            <button className={`btn btn-outline ${inWishlist ? 'active' : ''}`} onClick={handleToggleWishlist}>
              {inWishlist ? '❤️ In Wishlist' : '🤍 Add to Wishlist'}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="container" style={{ maxWidth: '700px', padding: '16px' }}>
        <h3>⭐ Reviews ({reviews.length})</h3>

        {isAuthenticated ? (
          <form onSubmit={handleSubmitReview} style={{ marginBottom: '20px' }}>
            {reviewError && <p className="error-text">{reviewError}</p>}
            <div className="form-group">
              <label>Your Rating</label>
              <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Comment (optional)</label>
              <textarea
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your thoughts about this product..."
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submittingReview}>
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        ) : (
          <p><Link to="/login" state={{ from: `/products/${id}` }}>Log in</Link> to leave a review.</p>
        )}

        {reviews.length === 0 ? (
          <p style={{ color: '#777' }}>No reviews yet. Be the first to review this product!</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="review-item">
              <div className="review-head">
                <strong>{review.user_name || review.reviewer_name}</strong>
                <span>{new Date(review.created_at).toLocaleDateString()}</span>
              </div>
              <StarRating rating={review.rating} />
              {review.comment && <p>{review.comment}</p>}
              {user?.id === review.user_id && (
                <button
                  onClick={() => handleDeleteReview(review.id)}
                  style={{ background: 'none', border: 'none', color: '#e94560', fontSize: '0.8rem', padding: 0 }}
                >
                  Delete my review
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <>
          <h2 className="section-title">You might also like</h2>
          <div className="product-grid">
            {related.map((p) => (
              <Link key={p.id} to={`/products/${p.id}`} className="product-card">
                <div className="img-wrap">{p.name.charAt(0)}</div>
                <div className="body">
                  <h3>{p.name}</h3>
                  <div className="price">${parseFloat(p.price).toFixed(2)}</div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
