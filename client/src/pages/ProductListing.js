import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getProducts, getCategories } from '../services/productService';

export default function ProductListing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || '';
  const page = parseInt(searchParams.get('page'), 10) || 1;

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getProducts({ search, category, sort, page, limit: 12 });
      setProducts(res.data.products);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, category, sort, page]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    getCategories().then((res) => setCategories(res.data.categories)).catch(() => {});
  }, []);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page'); // reset to page 1 whenever a filter changes
    setSearchParams(next);
  }

  function goToPage(newPage) {
    const next = new URLSearchParams(searchParams);
    next.set('page', newPage);
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div>
      <div className="category-bar">
        <button
          className={`category-chip ${!category ? 'active' : ''}`}
          onClick={() => updateParam('category', '')}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-chip ${category === cat.slug ? 'active' : ''}`}
            onClick={() => updateParam('category', cat.slug)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', flexWrap: 'wrap', gap: '8px' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
          {search ? `Results for "${search}"` : category ? categories.find((c) => c.slug === category)?.name || 'Products' : 'All Products'}
          {pagination && <span style={{ color: '#777', fontWeight: 400, fontSize: '0.85rem' }}> ({pagination.total})</span>}
        </h2>

        <select value={sort} onChange={(e) => updateParam('sort', e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc' }}>
          <option value="">Sort: Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {loading && <div className="loading-text">Loading products...</div>}
      {error && <div className="error-banner">{error}</div>}

      {!loading && !error && products.length === 0 && (
        <div className="empty-state">
          <h3>No products found</h3>
          <p>Try a different search term or category.</p>
          <Link to="/products" className="btn btn-primary">Clear Filters</Link>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '20px' }}>
              <button
                className="btn btn-outline"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              >
                ← Prev
              </button>
              <span style={{ alignSelf: 'center', fontSize: '0.9rem' }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                className="btn btn-outline"
                disabled={page >= pagination.totalPages}
                onClick={() => goToPage(page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
