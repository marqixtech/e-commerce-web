import { apiRequest } from './api';

export function getAllOrdersAdmin() {
  return apiRequest('/orders/admin/all');
}

export function updateOrderStatusAdmin(orderId, { status, note }) {
  return apiRequest(`/orders/${orderId}/status`, { method: 'PUT', body: { status, note } });
}

export function createProductAdmin(product) {
  return apiRequest('/products', { method: 'POST', body: product });
}

export function updateProductAdmin(id, fields) {
  return apiRequest(`/products/${id}`, { method: 'PUT', body: fields });
}

export function deleteProductAdmin(id) {
  return apiRequest(`/products/${id}`, { method: 'DELETE' });
}
