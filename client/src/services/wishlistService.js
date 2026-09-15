import { apiRequest } from './api';

export function getWishlist() {
  return apiRequest('/wishlist');
}

export function addToWishlist(productId) {
  return apiRequest('/wishlist', { method: 'POST', body: { productId } });
}

export function removeFromWishlist(productId) {
  return apiRequest(`/wishlist/${productId}`, { method: 'DELETE' });
}
