import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30s — enough for a warm server; wake-up is handled separately
});

// ─── Server Wake-Up Utility ───────────────────────────────────────────────────
// Render free tier sleeps after 15 min of inactivity.
// Call this on page load so the server is warm before the user submits a form.
let serverReady = false;
let wakeUpPromise = null;

export const wakeUpServer = () => {
  if (serverReady) return Promise.resolve();
  if (wakeUpPromise) return wakeUpPromise;

  wakeUpPromise = axios
    .get(`${API_BASE_URL}/public/health`, { timeout: 60000 }) // 60s for cold start
    .then(() => { serverReady = true; })
    .catch(() => { serverReady = true; }) // proceed even if health check fails
    .finally(() => { wakeUpPromise = null; });

  return wakeUpPromise;
};

// ─── Ingredient Service ───────────────────────────────────────────────────────
export const ingredientService = {
  getAll: async () => (await api.get('/ingredients')).data,
  getById: async (id) => (await api.get(`/ingredients/${id}`)).data,
  create: async (data) => (await api.post('/ingredients', data)).data,
  update: async (id, data) => (await api.put(`/ingredients/${id}`, data)).data,
  delete: async (id) => (await api.delete(`/ingredients/${id}`)).data,
  search: async (term) => (await api.get(`/ingredients/search?term=${term}`)).data,
  getByCategory: async (cat) => (await api.get(`/ingredients/category/${cat}`)).data,
  getCategories: async () => (await api.get('/ingredients/categories')).data,
};

// ─── Recipe Service ───────────────────────────────────────────────────────────
export const recipeService = {
  getAll: async () => (await api.get('/recipes')).data,
  getById: async (id) => (await api.get(`/recipes/${id}`)).data,
  create: async (data) => (await api.post('/recipes', data)).data,
  update: async (id, data) => (await api.put(`/recipes/${id}`, data)).data,
  delete: async (id) => (await api.delete(`/recipes/${id}`)).data,
  search: async (term) => (await api.get(`/recipes/search?term=${term}`)).data,
  getByPriceRange: async (min, max) =>
    (await api.get(`/recipes/price-range?min=${min}&max=${max}`)).data,
  calculateWhatIf: async (id, margin) =>
    (await api.post(`/recipes/${id}/what-if?margin=${margin}`)).data,
  getStatistics: async () => (await api.get('/recipes/statistics')).data,
};

// ─── Request Interceptor: attach JWT ─────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: standardize errors ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message;

    if (error.code === 'ECONNABORTED') {
      message = 'The server took too long to respond. Please try again.';
    } else if (!error.response) {
      message = 'Cannot reach the server. Please check your connection.';
    } else {
      message =
        error.response.data?.error ||
        error.response.data?.message ||
        error.response.data ||
        error.message ||
        'An unexpected error occurred.';
    }

    if (error.response?.status === 401) {
      // Token expired — clear auth and redirect
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = '/auth';
      }
    }

    console.error('API Error:', { message, status: error.response?.status });
    return Promise.reject({ message, status: error.response?.status, originalError: error });
  }
);

export default api;