import axios from 'axios';

// Create axios instance with base configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Ingredient API calls
export const ingredientService = {
  // Get all ingredients
  getAll: async () => {
    const response = await api.get('/ingredients');
    return response.data;
  },

  // Get ingredient by ID
  getById: async (id) => {
    const response = await api.get(`/ingredients/${id}`);
    return response.data;
  },

  // Create new ingredient
  create: async (ingredientData) => {
    const response = await api.post('/ingredients', ingredientData);
    return response.data;
  },

  // Update ingredient
  update: async (id, ingredientData) => {
    const response = await api.put(`/ingredients/${id}`, ingredientData);
    return response.data;
  },

  // Delete ingredient
  delete: async (id) => {
    const response = await api.delete(`/ingredients/${id}`);
    return response.data;
  },

  // Search ingredients
  search: async (term) => {
    const response = await api.get(`/ingredients/search?term=${term}`);
    return response.data;
  },

  // Get ingredients by category
  getByCategory: async (category) => {
    const response = await api.get(`/ingredients/category/${category}`);
    return response.data;
  },

  // Get all categories
  getCategories: async () => {
    const response = await api.get('/ingredients/categories');
    return response.data;
  },
};

// Recipe API calls
export const recipeService = {
  // Get all recipes
  getAll: async () => {
    const response = await api.get('/recipes');
    return response.data;
  },

  // Get recipe by ID
  getById: async (id) => {
    const response = await api.get(`/recipes/${id}`);
    return response.data;
  },

  // Create new recipe
  create: async (recipeData) => {
    const response = await api.post('/recipes', recipeData);
    return response.data;
  },

  // Update recipe
  update: async (id, recipeData) => {
    const response = await api.put(`/recipes/${id}`, recipeData);
    return response.data;
  },

  // Delete recipe
  delete: async (id) => {
    const response = await api.delete(`/recipes/${id}`);
    return response.data;
  },

  // Search recipes
  search: async (term) => {
    const response = await api.get(`/recipes/search?term=${term}`);
    return response.data;
  },

  // Get recipes by price range
  getByPriceRange: async (minPrice, maxPrice) => {
    const response = await api.get(`/recipes/price-range?min=${minPrice}&max=${maxPrice}`);
    return response.data;
  },

  // Calculate what-if scenario
  calculateWhatIf: async (id, margin) => {
    const response = await api.post(`/recipes/${id}/what-if?margin=${margin}`);
    return response.data;
  },

  // Get statistics
  getStatistics: async () => {
    const response = await api.get('/recipes/statistics');
    return response.data;
  },
};

// Error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;