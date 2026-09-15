import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getFeaturedProducts, getDeals, getCategories } from '../services/productService';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [deals, setDeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [featuredRes, dealsRes, categoriesRes] = await Promise.all([
          getFeaturedProducts(),
          getDeals(),
          getCategories(),
        ]);
        setFeatured(featuredRes.data.products);
        setDeals(dealsRes.data.products);
        setCategories(categoriesRes.data.categories);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  if (loading) return <div className="loading-text">Loading MARQIX SHOPPING MALL...</div>;
  if (error) return <div className="error-banner">{error}</div>;

  return (
    <div>
      {/* Categories */}
      <div className="category-bar">
        {categories.map((cat) => (
          <Link key={cat.id} to={`/products?category=${cat.slug}`} className="category-chip">
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Featured Products */}
      <h2 className="section-title">🌟 Featured Products</h2>
      {featured.length === 0 ? (
        <p className="container" style={{ padding: '16px' }}>No featured products yet.</p>
      ) : (
        <div className="product-grid">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Latest Deals */}
      <h2 className="section-title">🔥 Latest Deals</h2>
      {deals.length === 0 ? (
        <p className="container" style={{ padding: '16px' }}>No deals right now — check back soon.</p>
      ) : (
        <div className="product-grid">
          {deals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', padding: '24px' }}>
        <Link to="/products" className="btn btn-outline">Browse All Products</Link>
      </div>
    </div>
  );
}
