import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, getCategories } from '../services/productService';
import { createProductAdmin, updateProductAdmin, deleteProductAdmin } from '../services/adminService';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
  categoryId: '',
  brand: '',
  isFeatured: false,
  isDeal: false,
  discountPct: 0,
  imageUrl: '',
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProducts({ limit: 50 });
      setProducts(res.data.products);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    getCategories().then((res) => setCategories(res.data.categories)).catch(() => {});
  }, [loadProducts]);

  function startCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(product) {
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      categoryId: product.category_id || '',
      brand: product.brand || '',
      isFeatured: product.is_featured,
      isDeal: product.is_deal,
      discountPct: product.discount_pct || 0,
      imageUrl: '',
    });
    setEditingId(product.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10),
        categoryId: form.categoryId || null,
        discountPct: parseInt(form.discountPct, 10) || 0,
      };
      if (editingId) {
        await updateProductAdmin(editingId, payload);
      } else {
        await createProductAdmin(payload);
      }
      setShowForm(false);
      await loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    try {
      await deleteProductAdmin(id);
      await loadProducts();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="container" style={{ padding: '16px', maxWidth: '900px', margin: '0 auto' }}>
      <Link to="/admin" style={{ fontSize: '0.85rem' }}>← Back to Dashboard</Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0' }}>
        <h2 style={{ margin: 0 }}>Manage Products</h2>
        <button className="btn btn-primary" onClick={startCreate}>+ Add Product</button>
      </div>

      {error && <p className="error-text">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="form-page" style={{ margin: '0 0 20px' }}>
          <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Product' : 'New Product'}</h3>

          <div className="form-group">
            <label>Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Price ($)</label>
              <input type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Stock</label>
              <input type="number" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label>Category</label>
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Brand</label>
            <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          </div>

          <div className="form-group">
            <label>Image URL (optional)</label>
            <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 400 }}>
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
              Featured
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 400 }}>
              <input type="checkbox" checked={form.isDeal} onChange={(e) => setForm({ ...form, isDeal: e.target.checked })} />
              Deal
            </label>
            {form.isDeal && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontWeight: 400 }}>Discount %</label>
                <input
                  type="number"
                  style={{ width: '70px' }}
                  value={form.discountPct}
                  onChange={(e) => setForm({ ...form, discountPct: e.target.value })}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading-text">Loading products...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '10px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#1a1a2e', color: '#fff', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Name</th>
                <th style={{ padding: '10px' }}>Price</th>
                <th style={{ padding: '10px' }}>Stock</th>
                <th style={{ padding: '10px' }}>Category</th>
                <th style={{ padding: '10px' }}>Flags</th>
                <th style={{ padding: '10px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{p.name}</td>
                  <td style={{ padding: '10px' }}>${parseFloat(p.price).toFixed(2)}</td>
                  <td style={{ padding: '10px' }}>{p.stock}</td>
                  <td style={{ padding: '10px' }}>{p.category_name || '—'}</td>
                  <td style={{ padding: '10px', fontSize: '0.8rem' }}>
                    {p.is_featured && '⭐ '}
                    {p.is_deal && `🔥${p.discount_pct}%`}
                  </td>
                  <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                    <button onClick={() => startEdit(p)} style={{ marginRight: '8px', background: 'none', border: 'none', color: '#1a1a2e', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', color: '#e94560', cursor: 'pointer' }}>Delete</button>
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
