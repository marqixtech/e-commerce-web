import { apiRequest } from './api';

export function checkout({ shippingName, shippingPhone, shippingAddress, paymentMethod }) {
  return apiRequest('/orders/checkout', {
    method: 'POST',
    body: { shippingName, shippingPhone, shippingAddress, paymentMethod },
  });
}

export function getMyOrders() {
  return apiRequest('/orders');
}

export function getOrderById(id) {
  return apiRequest(`/orders/${id}`);
}
