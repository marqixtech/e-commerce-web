const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('marqix_token');
}

function setToken(token) {
  if (token) localStorage.setItem('marqix_token', token);
  else localStorage.removeItem('marqix_token');
}

// Central fetch wrapper: adds base URL, JSON headers, auth token,
// and throws a normal Error with the server's message on failure.
async function apiRequest(endpoint, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.message || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

export { apiRequest, getToken, setToken };
