import { apiRequest } from './api';

export function getCart() {
  return apiRequest('/cart');
}

export function addToCart(productId, quantity = 1) {
  return apiRequest('/cart', { method: 'POST', body: { productId, quantity } });
}

export function updateCartItem(productId, quantity) {
  return apiRequest(`/cart/${productId}`, { method: 'PUT', body: { quantity } });
}

export function removeFromCart(productId) {
  return apiRequest(`/cart/${productId}`, { method: 'DELETE' });
}

export function clearCart() {
  return apiRequest('/cart', { method: 'DELETE' });
}
