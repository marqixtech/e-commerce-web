import { apiRequest } from './api';

export function getProducts({ search, category, page, limit, sort } = {}) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  if (page) params.set('page', page);
  if (limit) params.set('limit', limit);
  if (sort) params.set('sort', sort);

  const query = params.toString();
  return apiRequest(`/products${query ? `?${query}` : ''}`, { auth: false });
}

export function getFeaturedProducts() {
  return apiRequest('/products/featured', { auth: false });
}

export function getDeals() {
  return apiRequest('/products/deals', { auth: false });
}

export function getCategories() {
  return apiRequest('/products/categories/all', { auth: false });
}

export function getProductById(id) {
  return apiRequest(`/products/${id}`, { auth: false });
}
