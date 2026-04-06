import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // ✅ FIX: 15s timeout so stuck requests fail with an error
});

// Ingredient API calls
export const ingredientService = {
  getAll: async () => {
    const response = await api.get('/ingredients');
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/ingredients/${id}`);
    return response.data;
  },
  create: async (ingredientData) => {
    const response = await api.post('/ingredients', ingredientData);
    return response.data;
  },
  update: async (id, ingredientData) => {
    const response = await api.put(`/ingredients/${id}`, ingredientData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/ingredients/${id}`);
    return response.data;
  },
  search: async (term) => {
    const response = await api.get(`/ingredients/search?term=${term}`);
    return response.data;
  },
  getByCategory: async (category) => {
    const response = await api.get(`/ingredients/category/${category}`);
    return response.data;
  },
  getCategories: async () => {
    const response = await api.get('/ingredients/categories');
    return response.data;
  },
};

// Recipe API calls
export const recipeService = {
  getAll: async () => {
    const response = await api.get('/recipes');
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/recipes/${id}`);
    return response.data;
  },
  create: async (recipeData) => {
    const response = await api.post('/recipes', recipeData);
    return response.data;
  },
  update: async (id, recipeData) => {
    const response = await api.put(`/recipes/${id}`, recipeData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/recipes/${id}`);
    return response.data;
  },
  search: async (term) => {
    const response = await api.get(`/recipes/search?term=${term}`);
    return response.data;
  },
  getByPriceRange: async (minPrice, maxPrice) => {
    const response = await api.get(`/recipes/price-range?min=${minPrice}&max=${maxPrice}`);
    return response.data;
  },
  calculateWhatIf: async (id, margin) => {
    const response = await api.post(`/recipes/${id}/what-if?margin=${margin}`);
    return response.data;
  },
  getStatistics: async () => {
    const response = await api.get('/recipes/statistics');
    return response.data;
  },
};

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const standardizedError = {
      message: error.code === 'ECONNABORTED'
        ? 'Request timed out. The server may be waking up — please try again in a moment.' // ✅ FIX: friendly timeout message
        : error.response?.data?.error || error.response?.data || error.message || 'An unexpected error occurred',
      status: error.response?.status,
      statusText: error.response?.statusText,
      originalError: error
    };
    
    console.error('API Error:', standardizedError);
    return Promise.reject(standardizedError);
  }
);

export default api;