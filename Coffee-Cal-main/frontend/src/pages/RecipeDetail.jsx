import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Calculator, Banknote, FileDown, Camera, X } from 'lucide-react';
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
  
  // State for the recipe picture
  const [finalRecipeImage, setFinalRecipeImage] = useState(null); // Holds the base64 string
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null); // Holds the data URL for preview

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

      // Populate image if it exists in data
      if (data.finalImageBase64) {
        setImagePreviewUrl(data.finalImageBase64);
        setFinalRecipeImage(data.finalImageBase64);
      } else {
        setImagePreviewUrl(null);
        setFinalRecipeImage(null);
      }

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

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (jpg, png, etc.)');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert('File size is too large. Please select an image smaller than 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result);
        setFinalRecipeImage(reader.result); 
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear the selected image
  const removeImage = () => {
    setFinalRecipeImage(null);
    setImagePreviewUrl(null);
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

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=800');
    
    const ingredientsHtml = formData.ingredients && formData.ingredients.length > 0
      ? formData.ingredients.map(recipeIng => {
          const ingredient = ingredients.find((i) => i.id === parseInt(recipeIng.ingredientId));
          const name = ingredient ? `${ingredient.name} (${ingredient.category})` : 'Unknown Ingredient';
          const unit = ingredient ? ingredient.baseUnit : '';
          const qty = recipeIng.quantity || '0';
          
          return `
            <tr>
              <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">${name}</td>
              <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${qty} ${unit}</td>
            </tr>
          `;
        }).join('')
      : '<tr><td colspan="2" style="padding: 12px 8px; text-align: center; color: #6b7280;">No ingredients listed</td></tr>';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recipe Export - ${formData.drinkName || 'Untitled Recipe'}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #111827; max-width: 800px; margin: 0 auto; }
            .header { border-bottom: 3px solid #422006; padding-bottom: 24px; margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-end; }
            h1 { color: #422006; margin: 0; font-size: 32px; }
            .recipe-image { max-height: 150px; max-width: 200px; border-radius: 12px; object-fit: contain; }
            .summary { display: flex; justify-content: space-between; margin-bottom: 40px; background: #f3f4f6; padding: 24px; border-radius: 12px; }
            .summary-item { text-align: center; flex: 1; }
            .summary-label { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em; }
            .summary-value { font-size: 24px; font-weight: 800; color: #111827; margin-top: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th { background: #422006; color: white; padding: 12px 8px; text-align: left; font-size: 14px; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>${formData.drinkName || 'Untitled Recipe'}</h1>
              <p style="color: #6b7280; margin-top: 8px;">${formData.notes || 'No notes provided'}</p>
            </div>
            ${imagePreviewUrl ? `<img src="${imagePreviewUrl}" class="recipe-image" alt="Recipe Image"/>` : ''}
          </div>
          
          <div class="summary">
            <div class="summary-item">
              <div class="summary-label">Total Cost</div>
              <div class="summary-value">₱${calculatedData.totalCost.toFixed(2)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Suggested Price</div>
              <div class="summary-value">₱${calculatedData.suggestedSellingPrice.toFixed(2)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Gross Profit</div>
              <div class="summary-value">₱${calculatedData.grossProfit.toFixed(2)}</div>
            </div>
          </div>

          <h2>Ingredients</h2>
          <table>
            <thead>
              <tr>
                <th>Ingredient</th>
                <th style="text-align: right;">Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${ingredientsHtml}
            </tbody>
          </table>

          <script>
            // Automatically trigger the print dialog once the window loads
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
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

      const currentShopId = parseInt(localStorage.getItem('shopId') || '1', 10);

      // FIX: Multiple variations included to catch whichever mapping your Java backend expects
      const dataToSubmit = {
        shop: { id: currentShopId }, // Often required by Spring Boot @ManyToOne
        shop_id: currentShopId,      // For snake_case DTOs
        shopId: currentShopId,       // Standard camelCase

        drinkName: formData.drinkName,
        targetMarginPercent: parseFloat(formData.targetMarginPercent) || 40,
        notes: formData.notes,
        // finalImageBase64: finalRecipeImage, // Uncomment when backend supports it
        ingredients: formData.ingredients.map((ing) => ({
          ingredientId: parseInt(ing.ingredientId, 10), 
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
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12 print:max-w-none print:m-0 print:p-0">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm flex items-center justify-between print:hidden">
          <p className="font-medium">{error}</p>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6 dark:border-coffee-700 print:border-none print:pb-0">
        <div className="flex items-center space-x-4">
          <Link to="/recipes" className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-coffee-800 dark:hover:bg-coffee-700 rounded-full transition-colors print:hidden">
            <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-cream-200" />
          </Link>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-cream-50 tracking-tight">
              {isNew ? 'Create New Recipe' : `Edit ${formData.drinkName}`}
            </h1>
            <p className="text-gray-500 dark:text-coffee-300 mt-1 print:text-gray-900">Configure ingredients and pricing for your menu</p>
          </div>
        </div>

        <button 
          type="button"
          onClick={handleExportPDF} 
          className="flex items-center justify-center space-x-2.5 bg-white hover:bg-gray-50 dark:bg-coffee-800 dark:hover:bg-coffee-700 text-gray-700 dark:text-cream-50 px-6 py-3 rounded-xl border border-gray-300 dark:border-coffee-600 shadow-sm transition-all active:scale-95 print:hidden shrink-0"
          title="Save as PDF for your records"
        >
          <FileDown className="w-5.5 h-5.5 text-red-500 dark:text-red-400" />
          <span className="font-bold sm:inline">Export PDF</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 print:space-y-6">
        
        {/* Basic Info Card */}
        <div className="bg-white dark:bg-coffee-800 rounded-2xl shadow-sm border border-gray-100 dark:border-coffee-700 p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-cream-50 mb-6 border-b pb-4 dark:border-coffee-700">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-coffee-300">Drink Name</label>
              <input
                type="text"
                required
                value={formData.drinkName}
                onChange={(e) => setFormData({ ...formData, drinkName: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-coffee-900 border border-gray-300 dark:border-coffee-600 rounded-xl focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-cream-50 placeholder-gray-400"
                placeholder="e.g., Salted Caramel Latte"
              />
            </div>

            <div className="space-y-2 print:hidden">
              <label className="block text-sm font-semibold text-gray-700 dark:text-coffee-300">Target Profit Margin (%)</label>
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
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-coffee-400 font-bold select-none">%</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-coffee-400">
                This will automatically update the Suggested Selling Price below.
              </p>
            </div>

            <div className="space-y-2 md:col-start-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-coffee-300">Recipe Picture (Optional)</label>
              <div className="flex flex-col items-center gap-4">
                {imagePreviewUrl ? (
                  <div className="relative border-4 border-coffee-100 rounded-3xl overflow-hidden shadow-inner flex-shrink-0 print:border-none print:shadow-none">
                    <img 
                      src={imagePreviewUrl} 
                      alt="Final drink preview" 
                      className="w-full h-auto object-contain md:max-h-60 rounded-3xl print:rounded-none" 
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-3 right-3 p-1.5 bg-coffee-800 hover:bg-black text-white rounded-full shadow-lg transition-colors print:hidden"
                      title="Remove image"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <label 
                    htmlFor="recipeImage" 
                    className="w-full flex flex-col items-center justify-center gap-3 p-8 bg-gray-50 dark:bg-coffee-900/50 border-4 border-dashed border-gray-300 dark:border-coffee-700 rounded-3xl cursor-pointer hover:border-coffee-300 hover:bg-gray-100 dark:hover:border-coffee-500 dark:hover:bg-coffee-900 transition-all group print:hidden"
                  >
                    <div className="bg-coffee-100 p-4 rounded-full group-hover:scale-110 transition-transform">
                      <Camera className="w-10 h-10 text-coffee-600" />
                    </div>
                    <span className="font-bold text-gray-700 dark:text-cream-100">Upload Final Drink Picture</span>
                    <span className="text-sm text-gray-500">Max size: 2MB</span>
                  </label>
                )}
                <input
                  type="file"
                  id="recipeImage"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden print:hidden"
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-coffee-300">Notes (Optional)</label>
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
              className="flex items-center space-x-2 text-sm font-semibold bg-coffee-100 text-coffee-700 hover:bg-coffee-200 dark:bg-coffee-700 dark:text-cream-50 dark:hover:bg-coffee-600 px-4 py-2.5 rounded-xl transition-colors print:hidden"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>Add Ingredient</span>
            </button>
          </div>

          {formData.ingredients.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 dark:bg-coffee-900/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-coffee-700 print:bg-transparent print:border-none print:py-0">
              <p className="text-gray-500 dark:text-coffee-400 mb-4 font-medium print:hidden">No ingredients added yet</p>
              <p className="text-gray-900 font-bold hidden print:block">Ingredients List (Internal)</p>
              <button type="button" onClick={addIngredient} className="inline-flex items-center space-x-2 bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-lg font-medium transition-colors print:hidden">
                <Plus className="w-5 h-5" />
                <span>Add First Ingredient</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 print:space-y-2">
              {formData.ingredients.map((recipeIng, index) => {
                const ingredient = ingredients.find((i) => i.id === parseInt(recipeIng.ingredientId));
                const qty = parseFloat(recipeIng.quantity) || 0;
                const lineCost = ingredient ? ingredient.costPerBaseUnit * qty : 0;

                return (
                  <div key={recipeIng.localId} className="flex flex-col md:flex-row items-start md:items-end gap-4 p-5 bg-gray-50 dark:bg-coffee-900/50 rounded-xl border border-gray-200 dark:border-coffee-700 transition-all hover:shadow-md print:flex-row print:border-none print:p-0 print:gap-2 print:shadow-none print:items-center">
                    <div className="flex-1 w-full md:w-auto space-y-1">
                      <label className="block text-xs font-semibold text-gray-600 dark:text-coffee-300">Ingredient</label>
                      <select
                        required
                        value={recipeIng.ingredientId}
                        onChange={(e) => updateIngredient(index, 'ingredientId', e.target.value)}
                        className="w-full px-3 py-2.5 bg-white dark:bg-coffee-800 border border-gray-300 dark:border-coffee-600 rounded-lg outline-none focus:ring-2 focus:ring-coffee-500 text-sm font-medium print:appearance-none print:bg-transparent print:border-none print:p-0 print:text-base print:font-normal"
                      >
                        <option value="">Select ingredient...</option>
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.category})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="w-full md:w-32 space-y-1">
                      <label className="block text-xs font-semibold text-gray-600 dark:text-coffee-300">
                        Qty {ingredient && <span className="text-gray-400 font-normal">({ingredient.baseUnit})</span>}
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={recipeIng.quantity}
                        onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                        className="w-full px-3 py-2.5 bg-white dark:bg-coffee-800 border border-gray-300 dark:border-coffee-600 rounded-lg outline-none focus:ring-2 focus:ring-coffee-500 text-sm font-medium print:bg-transparent print:border-none print:p-0 print:text-base print:font-normal"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="w-full md:w-36 space-y-1 print:col-start-2">
                      <label className="block text-xs font-semibold text-gray-600 dark:text-coffee-300">Line Cost</label>
                      <div className="w-full px-4 py-2.5 bg-white dark:bg-coffee-950 rounded-lg border-2 border-gray-200 dark:border-coffee-700 font-mono text-sm font-bold text-gray-800 dark:text-cream-100 flex items-center h-[42px] print:border-none print:bg-transparent print:p-0 print:h-auto print:font-bold print:text-base">
                        ₱{lineCost.toFixed(2)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeIngredient(recipeIng.localId)}
                      className="w-full md:w-auto p-3 mt-2 md:mt-0 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex justify-center items-center h-[42px] shrink-0 print:hidden"
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
          <div className="flex items-center mb-6 print:hidden">
            <Calculator className="w-6 h-6 text-gray-700 dark:text-caramel-400 mr-3 print:hidden" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-cream-50 print:font-extrabold print:text-2xl">Pricing Calculation</h2>
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
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1 tracking-tight">Portfolio Size (Ref.)</p>
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
        <div className="flex flex-col md:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-coffee-800 print:hidden">
          <button 
            type="submit" 
            className="flex-1 bg-gray-950 hover:bg-black dark:bg-cream-100 dark:hover:bg-cream-300 text-white dark:text-coffee-950 font-bold py-4 px-8 rounded-2xl shadow-lg transition-transform active:scale-[0.98] tracking-tight"
          >
            {isNew ? 'Create New Recipe' : 'Update Recipe Details'}
          </button>
          <Link 
            to="/recipes" 
            className="flex-1 bg-white hover:bg-gray-100 dark:bg-coffee-800 dark:hover:bg-coffee-700 text-gray-700 dark:text-cream-50 font-bold py-4 px-8 rounded-2xl border border-gray-300 dark:border-coffee-600 shadow-sm text-center transition-colors tracking-tight"
          >
            Cancel and Discard Changes
          </Link>
        </div>
      </form>
    </div>
  );
};

export default RecipeDetail;