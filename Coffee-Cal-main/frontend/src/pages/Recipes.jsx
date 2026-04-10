import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Calculator, Banknote, FileDown } from 'lucide-react';
import { recipeService, ingredientService } from '../services/api';

const RecipeDetail = ({ onUpdate }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Safely check if it's a new recipe, handling actual undefined or string "undefined"
  const isNew = !id || id === 'new' || id === 'undefined';

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
    // Only fetch if we have a valid, existing ID
    if (!isNew) {
      fetchRecipe();
    }
  }, [id, isNew]);

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
        drinkName: data.drinkName || '',
        targetMarginPercent: data.targetMarginPercent?.toString() || '40',
        notes: data.notes || '',
        ingredients: data.ingredients?.map((ing) => ({
          localId: Date.now() + Math.random(),
          ingredientId: ing.ingredientId,
          quantity: ing.quantity.toString(),
        })) || [],
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

  if (loading) return <div className="text-center py-12 dark:text-cream-50 font-medium">Loading recipe details...</div>;

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm flex items-center justify-between">
          <p className="font-medium">{error}</p>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/recipes" className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-coffee-800 dark:hover:bg-coffee-700 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-cream-200" />
          </Link>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-cream-50">
              {isNew ? 'Create New Recipe' : 'Edit Recipe'}
            </h1>
            <p className="text-gray-500 dark:text-coffee-300 mt-1">Configure ingredients and pricing</p>
          </div>
        </div>

        {/* PDF Export Button (Only shows if editing an existing recipe) */}
        {!isNew && (
          <button 
            type="button"
            onClick={() => window.print()} 
            className="flex items-center space-x-2 bg-white hover:bg-gray-50 dark:bg-coffee-800 dark:hover:bg-coffee-700 text-gray-700 dark:text-cream-50 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-coffee-600 shadow-sm transition-all active:scale-95 print:hidden"
            title="Save as PDF"
          >
            <FileDown className="w-5 h-5 text-red-500 dark:text-red-400" />
            <span className="font-bold hidden sm:inline">Export PDF</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 print:space-y-6">
        
        {/* Basic Info Card */}
        <div className="bg-white dark:bg-coffee-800 rounded-2xl shadow-sm border border-gray-100 dark:border-coffee-700 p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-cream-50 mb-6 border-b pb-4 dark:border-coffee-700">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Drink Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-coffee-300 mb-2">Drink Name</label>
              <input
                type="text"
                required
                value={formData.drinkName}
                onChange={(e) => setFormData({ ...formData, drinkName: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-coffee-900 border border-gray-300 dark:border-coffee-600 rounded-xl focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-cream-50"
                placeholder="e.g., Salted Caramel Latte"
              />
            </div>

            {/* Profit Margin */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-coffee-300 mb-2">Target Profit Margin (%)</label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  max="99"
                  step="0.1"
                  value={formData.targetMarginPercent}
                  onChange={(e) => setFormData({ ...formData, targetMarginPercent: e.target.value })}
                  className="w-full px-4 py-3 pr-10 bg-gray-50 dark:bg-coffee-900 border border-gray-300 dark:border-coffee-600 rounded-xl focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-cream-50"
                  placeholder="e.g., 40"
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold select-none">%</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-coffee-400 mt-2 print:hidden">
                Changes will automatically update the Suggested Selling Price.
              </p>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-coffee-300 mb-2">Notes (Optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-coffee-900 border border-gray-300 dark:border-coffee-600 rounded-xl focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-cream-50 resize-y"
                rows="4"
                placeholder="Add preparation instructions or special notes here..."
              />
            </div>
          </div>
        </div>

        {/* Ingredients Card */}
        <div className="bg-white dark:bg-coffee-800 rounded-2xl shadow-sm border border-gray-100 dark:border-coffee-700 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6 border-b pb-4 dark:border-coffee-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-cream-50">Ingredients</h2>
            <button 
              type="button" 
              onClick={addIngredient} 
              className="flex items-center space-x-2 text-sm font-semibold bg-coffee-100 text-coffee-700 hover:bg-coffee-200 dark:bg-coffee-700 dark:text-cream-50 dark:hover:bg-coffee-600 px-4 py-2 rounded-lg transition-colors print:hidden"
            >
              <Plus className="w-4 h-4" />
              <span>Add Ingredient</span>
            </button>
          </div>

          {formData.ingredients.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 dark:bg-coffee-900/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-coffee-700">
              <p className="text-gray-500 dark:text-coffee-400 mb-4 font-medium">No ingredients added yet</p>
              <button type="button" onClick={addIngredient} className="inline-flex items-center space-x-2 bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-lg font-medium transition-colors print:hidden">
                <Plus className="w-5 h-5" />
                <span>Add First Ingredient</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.ingredients.map((recipeIng, index) => {
                const ingredient = ingredients.find((i) => i.id === parseInt(recipeIng.ingredientId));
                const qty = parseFloat(recipeIng.quantity) || 0;
                const lineCost = ingredient ? ingredient.costPerBaseUnit * qty : 0;

                return (
                  <div key={recipeIng.localId} className="flex flex-col md:flex-row items-start md:items-end gap-4 p-5 bg-gray-50 dark:bg-coffee-900/50 rounded-xl border border-gray-200 dark:border-coffee-700 transition-all hover:shadow-md print:border-none print:p-2 print:shadow-none">
                    <div className="flex-1 w-full md:w-auto">
                      <label className="block text-xs font-semibold text-gray-600 dark:text-coffee-300 mb-2">Ingredient</label>
                      <select
                        required
                        value={recipeIng.ingredientId}
                        onChange={(e) => updateIngredient(index, 'ingredientId', e.target.value)}
                        className="w-full px-3 py-2.5 bg-white dark:bg-coffee-800 border border-gray-300 dark:border-coffee-600 rounded-lg outline-none focus:ring-2 focus:ring-coffee-500 text-sm print:appearance-none print:bg-transparent print:border-none print:p-0"
                      >
                        <option value="">Select ingredient...</option>
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.category})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="w-full md:w-32">
                      <label className="block text-xs font-semibold text-gray-600 dark:text-coffee-300 mb-2">
                        Qty {ingredient && <span className="text-gray-400">({ingredient.baseUnit})</span>}
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={recipeIng.quantity}
                        onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                        className="w-full px-3 py-2.5 bg-white dark:bg-coffee-800 border border-gray-300 dark:border-coffee-600 rounded-lg outline-none focus:ring-2 focus:ring-coffee-500 text-sm print:bg-transparent print:border-none print:p-0"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="w-full md:w-36">
                      <label className="block text-xs font-semibold text-gray-600 dark:text-coffee-300 mb-2">Line Cost</label>
                      <div className="w-full px-4 py-2.5 bg-white dark:bg-coffee-950 rounded-lg border-2 border-gray-200 dark:border-coffee-700 font-mono text-sm font-bold text-gray-800 dark:text-cream-100 flex items-center h-[42px] print:border-none print:bg-transparent print:p-0 print:h-auto">
                        ₱{lineCost.toFixed(2)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeIngredient(recipeIng.localId)}
                      className="w-full md:w-auto p-3 mt-2 md:mt-0 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex justify-center items-center h-[42px] print:hidden"
                      title="Remove Ingredient"
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
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-coffee-800 dark:to-coffee-900 rounded-2xl shadow-sm border border-gray-200 dark:border-coffee-700 p-6 md:p-8 print:bg-none print:border-none print:p-0">
          <div className="flex items-center mb-6">
            <Calculator className="w-6 h-6 text-gray-700 dark:text-caramel-400 mr-3 print:hidden" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-cream-50">Pricing Calculation</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-coffee-950 rounded-xl p-5 border border-gray-200 dark:border-coffee-700 shadow-sm print:border-gray-300">
              <p className="text-sm font-semibold text-gray-500 dark:text-coffee-400 mb-1">Total Cost</p>
              <p className="text-3xl font-extrabold text-gray-900 dark:text-cream-50 tracking-tight">
                ₱{calculatedData.totalCost.toFixed(2)}
              </p>
            </div>

            <div className="bg-[#eefcf2] dark:from-green-900/20 dark:to-green-900/10 rounded-xl p-5 border border-[#c6f6d5] dark:border-green-800 shadow-sm print:border-gray-300 print:bg-transparent">
              <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-1">Gross Profit</p>
              <p className="text-3xl font-extrabold text-green-800 dark:text-green-500 tracking-tight">
                ₱{calculatedData.grossProfit.toFixed(2)}
              </p>
            </div>

            <div className="bg-[#eff6ff] dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl p-5 border border-[#bfdbfe] dark:border-blue-800 shadow-sm print:border-gray-300 print:bg-transparent">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">Profit Margin</p>
              <p className="text-3xl font-extrabold text-blue-800 dark:text-blue-500 tracking-tight">
                {calculatedData.actualMarginPercent.toFixed(1)}%
              </p>
            </div>

            <div className="bg-[#422006] dark:bg-coffee-900 rounded-xl p-5 shadow-lg border border-[#78350f] dark:border-coffee-700 flex flex-col justify-center print:border-gray-300 print:bg-transparent print:text-black">
              <div className="flex items-center mb-1">
                <Banknote className="w-5 h-5 text-orange-200 mr-2 print:text-gray-800" />
                <p className="text-sm font-semibold text-orange-100 print:text-gray-800">Suggested Selling Price</p>
              </div>
              <p className="text-4xl font-extrabold text-white tracking-tight print:text-black">
                ₱{calculatedData.suggestedSellingPrice.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-gray-200 dark:border-coffee-800 print:hidden">
          <button 
            type="submit" 
            className="flex-1 bg-black hover:bg-gray-800 dark:bg-cream-50 dark:hover:bg-cream-200 text-white dark:text-coffee-900 font-bold py-4 px-6 rounded-xl shadow-md transition-transform active:scale-[0.98]"
          >
            {isNew ? 'Create Recipe' : 'Update Recipe'}
          </button>
          <Link 
            to="/recipes" 
            className="flex-1 bg-white hover:bg-gray-50 dark:bg-coffee-800 dark:hover:bg-coffee-700 text-gray-700 dark:text-cream-50 font-bold py-4 px-6 rounded-xl border border-gray-300 dark:border-coffee-600 shadow-sm text-center transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default RecipeDetail;