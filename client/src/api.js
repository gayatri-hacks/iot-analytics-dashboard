const API_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Something went wrong');
  return body;
}

const withAuth = (token, options = {}) => ({ ...options, headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) } });

export const api = {
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (credentials) => request('/auth/register', { method: 'POST', body: JSON.stringify(credentials) }),
  me: (token) => request('/auth/me', withAuth(token)),
  generate: (token, count) => request('/readings/generate', withAuth(token, { method: 'POST', body: JSON.stringify({ count }) })),
  analysis: (token) => request('/readings/analysis', withAuth(token)),
  adminReadings: (token) => request('/admin/readings', withAuth(token)),
};
