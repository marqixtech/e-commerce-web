import { apiRequest } from './api';

export function register({ fullName, email, password, phone }) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: { fullName, email, password, phone },
    auth: false,
  });
}

export function login({ email, password }) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
}

export function getMe() {
  return apiRequest('/auth/me');
}
