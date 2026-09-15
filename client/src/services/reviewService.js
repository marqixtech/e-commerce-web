import { apiRequest } from './api';

export function getProductReviews(productId) {
  return apiRequest(`/products/${productId}/reviews`, { auth: false });
}

export function submitReview(productId, { rating, comment }) {
  return apiRequest(`/products/${productId}/reviews`, {
    method: 'POST',
    body: { rating, comment },
  });
}

export function deleteReview(productId, reviewId) {
  return apiRequest(`/products/${productId}/reviews/${reviewId}`, { method: 'DELETE' });
}
