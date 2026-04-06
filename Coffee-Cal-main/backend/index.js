// server/index.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Allows Vercel to talk to Render
app.use(bodyParser.json());

// --- IN-MEMORY DATABASE (Resets on restart) ---
let ingredients = [
  { id: 1, name: 'Espresso Beans', category: 'Beans', baseUnit: 'g', packSize: 1000, packPrice: 800, costPerBaseUnit: 0.8 },
  { id: 2, name: 'Full Cream Milk', category: 'Milk', baseUnit: 'ml', packSize: 1000, packPrice: 100, costPerBaseUnit: 0.1 }
];
let recipes = [];

// --- ROUTES ---

// Get all ingredients
app.get('/ingredients', (req, res) => {
  res.json(ingredients);
});

// Add ingredient
app.post('/ingredients', (req, res) => {
  const newItem = { id: Date.now(), ...req.body };
  ingredients.push(newItem);
  res.status(201).json(newItem);
});

// Delete ingredient
app.delete('/ingredients/:id', (req, res) => {
  ingredients = ingredients.filter(i => i.id != req.params.id);
  res.json({ success: true });
});

// Get all recipes
app.get('/recipes', (req, res) => {
  res.json(recipes);
});

// Add recipe
app.post('/recipes', (req, res) => {
  const newItem = { id: Date.now(), ...req.body };
  recipes.push(newItem);
  res.status(201).json(newItem);
});

// Delete recipe
app.delete('/recipes/:id', (req, res) => {
  recipes = recipes.filter(r => r.id != req.params.id);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});