import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Calculator, PhilippinePeso } from 'lucide-react';
import { recipeService, ingredientService } from '../services/api';

const RecipeDetail = ({ onUpdate }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [ingredients, setIngredients] = useState([]);
  const [formData, setFormData] = useState({
    drinkName: '',
    targetMarginPercent: '40', // Default margin
    notes: '',
    ingredients: [],
  });
  const [calculatedData, setCalculatedData] = useState({
    totalCost: 0,
    suggestedSellingPrice: 0,
    grossProfit: 0,
    actualMarginPercent: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchIngredients();
    if (!isNew) {
      fetchRecipe();
    }
  }, [id]);

  useEffect(() => {
    calculateCosts();
  }, [formData.ingredients, formData.targetMarginPercent]);

  const fetchIngredients = async () => {
    try {
      const data = await ingredientService.getAll();
      setIngredients(data);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
  };

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await recipeService.getById(id);
      setFormData({
        drinkName: data.drinkName,
        targetMarginPercent: data.targetMarginPercent?.toString() || '40',
        notes: data.notes || '',
        ingredients: data.ingredients.map((ing) => ({
          localId: Date.now() + Math.random(),
          ingredientId: ing.ingredientId,
          quantity: ing.quantity.toString(),
        })),
      });
    } catch (error) {
      setError(error.message || 'Failed to load recipe');
      console.error('Error fetching recipe:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCosts = () => {
    let totalCost = 0;

    for (const recipeIng of formData.ingredients) {
      const ingredient = ingredients.find((i) => i.id === parseInt(recipeIng.ingredientId));
      const qty = parseFloat(recipeIng.quantity) || 0;

      if (ingredient && qty > 0) {
        const lineCost = ingredient.costPerBaseUnit * qty;
        totalCost += lineCost;
      }
    }

    const marginPercent = parseFloat(formData.targetMarginPercent) || 0;
    let sellingPrice = 0;
    let grossProfit = 0;

    if (marginPercent > 0 && marginPercent < 100) {
      const marginDecimal = marginPercent / 100;
      const divisor = 1 - marginDecimal;
      if (divisor > 0) {
        sellingPrice = totalCost / divisor;
        grossProfit = sellingPrice - totalCost;
      }
    }

    setCalculatedData({
      totalCost,
      suggestedSellingPrice: sellingPrice,
      grossProfit,
      actualMarginPercent: marginPercent,
    });
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [
        ...formData.ingredients,
        { localId: Date.now(), ingredientId: '', quantity: '' }
      ],
    });
  };

  const removeIngredient = (localId) => {
    const newIngredients = formData.ingredients.filter((item) => item.localId !== localId);
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const updateIngredient = (index, field, value) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index][field] = value;
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.drinkName.trim()) return alert('Please enter a drink name');
    if (formData.ingredients.length === 0) return alert('Please add at least one ingredient');

    for (const ing of formData.ingredients) {
      if (!ing.ingredientId || !ing.quantity) return alert('Please complete all ingredient selections');
    }

    try {
      setError('');
      setLoading(true);
      const dataToSubmit = {
        drinkName: formData.drinkName,
        targetMarginPercent: parseFloat(formData.targetMarginPercent) || 40,
        notes: formData.notes,
        ingredients: formData.ingredients.map((ing) => ({
          ingredientId: parseInt(ing.ingredientId),
          quantity: parseFloat(ing.quantity),
        })),
      };

      if (isNew) {
        await recipeService.create(dataToSubmit);
      } else {
        await recipeService.update(id, dataToSubmit);
      }

      if (onUpdate) onUpdate();
      navigate('/recipes');
    } catch (error) {
      setError(error.message || 'Failed to save recipe');
      console.error('Error saving recipe:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12 dark:text-cream-50">Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 flex items-center justify-between">
          <span>{error}</span>
          <button 
            onClick={() => setError('')}
            className="text-red-700 hover:text-red-900 font-bold px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/recipes" className="p-2 hover:bg-coffee-100 dark:hover:bg-coffee-800 rounded-lg transition-colors">
          <ArrowLeft className="w-6 h-6 text-coffee-700 dark:text-cream-200" />
        </Link>
        <div>
          <h1 className="text-4xl font-bold text-coffee-900 dark:text-cream-50">
            {isNew ? 'Create New Recipe' : 'Edit Recipe'}
          </h1>
          <p className="text-coffee-600 dark:text-coffee-300 mt-1">Configure ingredients and pricing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <div className="card dark:bg-coffee-800 dark:border-coffee-700">
          <h2 className="text-2xl font-bold text-coffee-900 dark:text-cream-50 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="label dark:text-coffee-300">Drink Name</label>
              <input
                type="text"
                required
                value={formData.drinkName}
                onChange={(e) => setFormData({ ...formData, drinkName: e.target.value })}
                className="input-field dark:bg-coffee-900 dark:border-coffee-700 dark:text-cream-50"
                placeholder="e.g., Salted Caramel Latte"
              />
            </div>

            <div>
              <label className="label dark:text-coffee-300">Target Profit Margin (%)</label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  max="99"
                  step="0.1"
                  value={formData.targetMarginPercent}
                  onChange={(e) => setFormData({ ...formData, targetMarginPercent: e.target.value })}
                  className="input-field dark:bg-coffee-900 dark:border-coffee-700 dark:text-cream-50"
                  placeholder="e.g., 40"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-coffee-600 dark:text-coffee-400 font-medium">%</span>
              </div>
              <p className="text-sm text-coffee-600 dark:text-coffee-400 mt-1">
                Changing this will automatically update the Suggested Selling Price below.
              </p>
            </div>

            <div>
              <label className="label dark:text-coffee-300">Notes (Optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-field dark:bg-coffee-900 dark:border-coffee-700 dark:text-cream-50"
                rows="3"
              />
            </div>
          </div>
        </div>

        {/* Ingredients Card */}
        <div className="card dark:bg-coffee-800 dark:border-coffee-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-coffee-900 dark:text-cream-50">Ingredients</h2>
            <button type="button" onClick={addIngredient} className="btn-secondary dark:bg-coffee-700 dark:text-cream-50 dark:hover:bg-coffee-600 flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Add Ingredient</span>
            </button>
          </div>

          {formData.ingredients.length === 0 ? (
            <div className="text-center py-12 bg-coffee-50 dark:bg-coffee-900/50 rounded-lg">
              <p className="text-coffee-600 dark:text-coffee-400 mb-4">No ingredients added yet</p>
              <button type="button" onClick={addIngredient} className="btn-primary inline-flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Add First Ingredient</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.ingredients.map((recipeIng, index) => {
                const ingredient = ingredients.find((i) => i.id === parseInt(recipeIng.ingredientId));
                const qty = parseFloat(recipeIng.quantity) || 0;
                const lineCost = ingredient ? ingredient.costPerBaseUnit * qty : 0;

                return (
                  <div key={recipeIng.localId} className="flex items-end space-x-3 p-4 bg-coffee-50 dark:bg-coffee-900/50 rounded-lg border dark:border-coffee-700">
                    <div className="flex-1">
                      <label className="label text-xs dark:text-coffee-300">Ingredient</label>
                      <select
                        required
                        value={recipeIng.ingredientId}
                        onChange={(e) => updateIngredient(index, 'ingredientId', e.target.value)}
                        className="input-field dark:bg-coffee-800 dark:border-coffee-600 dark:text-cream-50"
                      >
                        <option value="">Select ingredient...</option>
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.category})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <label className="label text-xs dark:text-coffee-300">
                        Quantity {ingredient && `(${ingredient.baseUnit})`}
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={recipeIng.quantity}
                        onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                        className="input-field dark:bg-coffee-800 dark:border-coffee-600 dark:text-cream-50"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="w-32">
                      <label className="label text-xs dark:text-coffee-300">Line Cost</label>
                      <div className="px-4 py-3 bg-white dark:bg-coffee-950 rounded-lg border-2 border-coffee-200 dark:border-coffee-700 font-mono text-sm font-semibold text-coffee-900 dark:text-cream-100">
                        ₱{lineCost.toFixed(2)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeIngredient(recipeIng.localId)}
                      className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cost Calculation Summary */}
        <div className="card bg-gradient-to-br from-coffee-50 to-cream-50 dark:from-coffee-800 dark:to-coffee-900 dark:border-coffee-700">
          <div className="flex items-center mb-6">
            <Calculator className="w-6 h-6 text-coffee-600 dark:text-caramel-400 mr-2" />
            <h2 className="text-2xl font-bold text-coffee-900 dark:text-cream-50">Pricing Calculation</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-coffee-950 rounded-lg p-4 border-2 border-coffee-200 dark:border-coffee-700">
              <p className="text-sm text-coffee-600 dark:text-coffee-400 mb-1">Total Cost</p>
              <p className="text-2xl font-bold text-coffee-900 dark:text-cream-50">
                ₱{calculatedData.totalCost.toFixed(2)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-matcha-600/20 dark:to-matcha-600/10 rounded-lg p-4 border-2 border-green-200 dark:border-matcha-500/50">
              <p className="text-sm text-green-700 dark:text-matcha-400 mb-1">Gross Profit</p>
              <p className="text-2xl font-bold text-green-900 dark:text-matcha-500">
                ₱{calculatedData.grossProfit.toFixed(2)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-caramel-600/20 dark:to-caramel-600/10 rounded-lg p-4 border-2 border-blue-200 dark:border-caramel-500/50">
              <p className="text-sm text-blue-700 dark:text-caramel-400 mb-1">Profit Margin</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-caramel-500">
                {calculatedData.actualMarginPercent.toFixed(1)}%
              </p>
            </div>

            <div className="bg-gradient-to-br from-coffee-600 to-coffee-800 dark:from-coffee-700 dark:to-coffee-800 rounded-lg p-4 border-2 border-coffee-700 dark:border-coffee-600">
              <div className="flex items-center mb-1">
                <PhilippinePeso className="w-5 h-5 text-cream-200 mr-1" />
                <p className="text-sm text-cream-200">Suggested Selling Price</p>
              </div>
              <p className="text-3xl font-bold text-white">
                ₱{calculatedData.suggestedSellingPrice.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button type="submit" className="btn-primary flex-1">
            {isNew ? 'Create Recipe' : 'Update Recipe'}
          </button>
          <Link to="/recipes" className="btn-secondary dark:bg-coffee-800 dark:text-cream-50 flex-1 text-center">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default RecipeDetail;