import { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Save, X, Coffee, FileDown, Camera } from 'lucide-react';
import api from '../services/api';

export default function CoffeeCosting() {
  const [activeTab, setActiveTab] = useState('recipes');
  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [showNewRecipe, setShowNewRecipe] = useState(false);
  const [showNewIngredient, setShowNewIngredient] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');

  // New recipe state
  const [newRecipe, setNewRecipe] = useState({
    name: '', sellingPrice: '', ingredients: [], imageBase64: null
  });

  // New ingredient state
  const [newIngredient, setNewIngredient] = useState({
    name: '', category: 'Beans', baseUnit: 'g', packSize: '', packPrice: ''
  });

  useEffect(() => {
    fetchRecipes();
    fetchIngredients();
  }, []);

  const fetchRecipes = async () => {
    try { const response = await api.get('/recipes'); setRecipes(response.data || []); } catch (error) { console.error('Error fetching recipes:', error); }
  };

  const fetchIngredients = async () => {
    try { const response = await api.get('/ingredients'); setIngredients(response.data || []); } catch (error) { console.error('Error fetching ingredients:', error); }
  };

  // --- CORE MATH LOGIC ---

  const calculateRecipeCost = (recipeIngredients) => {
    if (!recipeIngredients || recipeIngredients.length === 0) return 0;

    return recipeIngredients.reduce((total, ri) => {
      const idToFind = ri.ingredientId || (ri.ingredient ? ri.ingredient.id : null);
      const ingredient = ingredients.find((ing) => ing.id == idToFind);

      if (ingredient && ingredient.costPerBaseUnit) {
        return total + (parseFloat(ingredient.costPerBaseUnit) * parseFloat(ri.quantity || 0));
      }
      return total;
    }, 0);
  };

  // --- ACTIONS ---

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size too large. Please select an image under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewRecipe({ ...newRecipe, imageBase64: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportPDF = (recipe) => {
    const printWindow = window.open('', '_blank', 'width=800,height=800');
    const recipeIngredients = recipe.ingredients || [];
    const cost = calculateRecipeCost(recipeIngredients);
    const price = parseFloat(recipe.sellingPrice) || 0;
    const profit = price - cost;

    const ingredientsHtml = recipeIngredients.map(ri => {
      const idToFind = ri.ingredientId || (ri.ingredient ? ri.ingredient.id : null);
      const ing = ingredients.find(x => x.id === idToFind);
      const name = ing ? `${ing.name} (${ing.category})` : 'Unknown Item';
      
      return `
        <tr>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">${name}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${ri.quantity} ${ing?.baseUnit || ''}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recipe Export - ${recipe.drinkName || recipe.name || 'Untitled'}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #111827; max-width: 800px; margin: 0 auto; }
            .header { border-bottom: 3px solid #823A1E; padding-bottom: 24px; margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-end; }
            h1 { color: #823A1E; margin: 0; font-size: 32px; }
            .recipe-image { max-height: 150px; max-width: 200px; border-radius: 12px; object-fit: contain; }
            .summary { display: flex; justify-content: space-between; margin-bottom: 40px; background: #f3f4f6; padding: 24px; border-radius: 12px; }
            .summary-item { text-align: center; flex: 1; }
            .summary-label { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em; }
            .summary-value { font-size: 24px; font-weight: 800; color: #111827; margin-top: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th { background: #823A1E; color: white; padding: 12px 8px; text-align: left; font-size: 14px; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>${recipe.drinkName || recipe.name || 'Untitled Recipe'}</h1>
            </div>
            ${recipe.image ? `<img src="${recipe.image}" class="recipe-image" alt="Recipe Image"/>` : ''}
          </div>
          
          <div class="summary">
            <div class="summary-item">
              <div class="summary-label">Total Cost</div>
              <div class="summary-value">₱${cost.toFixed(2)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Suggested Price</div>
              <div class="summary-value">₱${price.toFixed(2)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Gross Profit</div>
              <div class="summary-value">₱${profit.toFixed(2)}</div>
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
              ${ingredientsHtml || '<tr><td colspan="2" style="text-align: center; color: #6b7280;">No ingredients listed</td></tr>'}
            </tbody>
          </table>

          <script>
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

  const handleAddIngredient = async () => {
    try {
      if (!newIngredient.name || !newIngredient.packSize || !newIngredient.packPrice) return alert("Please fill all fields.");

      const rawPackSize = parseFloat(newIngredient.packSize);
      const rawPackPrice = parseFloat(newIngredient.packPrice);
      const selectedUnit = newIngredient.baseUnit;

      let finalSizeInBaseUnits = rawPackSize;
      let finalBaseUnitLabel = selectedUnit;

      if (selectedUnit === 'L') {
        finalSizeInBaseUnits = rawPackSize * 1000;
        finalBaseUnitLabel = 'ml';
      } else if (selectedUnit === 'kg') {
        finalSizeInBaseUnits = rawPackSize * 1000;
        finalBaseUnitLabel = 'g';
      }

      const costPerUnit = rawPackPrice / finalSizeInBaseUnits;

      const payload = {
        name: newIngredient.name,
        category: newIngredient.category,
        baseUnit: finalBaseUnitLabel,
        packSize: finalSizeInBaseUnits,
        packPrice: rawPackPrice,
        costPerBaseUnit: costPerUnit
      };

      await api.post('/ingredients', payload);

      fetchIngredients();
      setShowNewIngredient(false);
      setNewIngredient({ name: '', category: 'Beans', baseUnit: 'g', packSize: '', packPrice: '' });
    } catch (error) {
      console.error("Add Ingredient Error:", error);
      alert('Error adding ingredient.');
    }
  };

  const handleAddRecipe = async () => {
    if (!newRecipe.name) return alert("Please enter a recipe name");
    if (newRecipe.ingredients.length === 0) return alert("Please add ingredients");

    try {
      const payload = {
        drinkName: newRecipe.name,
        sellingPrice: parseFloat(newRecipe.sellingPrice),
        image: newRecipe.imageBase64, 
        ingredients: newRecipe.ingredients.map(ing => ({
          ingredientId: parseInt(ing.ingredientId || ing.id),
          quantity: parseFloat(ing.quantity)
        }))
      };

      await api.post('/recipes', payload);

      alert("Recipe saved successfully!");
      fetchRecipes();
      setNewRecipe({ name: '', sellingPrice: '', ingredients: [], imageBase64: null });
      setShowNewRecipe(false);

    } catch (error) {
      console.error("Error adding recipe:", error);
      alert("Failed to save recipe.");
    }
  };

  const handleDeleteRecipe = async (id) => { if (confirm('Delete recipe?')) { await api.delete(`/recipes/${id}`); fetchRecipes(); } };
  const handleDeleteIngredient = async (id) => { if (confirm('Delete ingredient?')) { await api.delete(`/ingredients/${id}`); fetchIngredients(); } };

  const updateRecipeIngredient = (index, field, value) => {
    setNewRecipe(prev => ({ ...prev, ingredients: prev.ingredients.map((ing, i) => i === index ? { ...ing, [field]: value } : ing) }));
  };
  const addRecipeIngredient = () => setNewRecipe(prev => ({ ...prev, ingredients: [...prev.ingredients, { ingredientId: '', quantity: '' }] }));
  const removeRecipeIngredient = (index) => setNewRecipe(prev => ({ ...prev, ingredients: prev.ingredients.filter((_, i) => i !== index) }));

  const filteredIngredients = categoryFilter === 'All' ? ingredients : ingredients.filter(ing => ing.category === categoryFilter);

  const formRecipeCost = calculateRecipeCost(newRecipe.ingredients);
  const formSellingPrice = parseFloat(newRecipe.sellingPrice) || 0;
  const formProfit = formSellingPrice - formRecipeCost;

  return (
    <div className="rounded-xl min-h-screen bg-[#FDFBF7] dark:bg-[#1A1412] transition-colors duration-200 font-sans text-[#4A403A] dark:text-[#E6DCC8]">
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#823A1E] dark:text-[#D4A373] flex items-center gap-2">
              <Coffee className="w-8 h-8"/> Coffee Costing
            </h1>
            <p className="text-[#8C7B70] dark:text-[#A09080] mt-1">Inventory Management & Profit Analysis</p>
          </div>

          <div className="flex bg-[#EFEBE4] dark:bg-[#2C2420] p-1 rounded-xl shadow-sm border border-[#E6DCC8] dark:border-[#423630] mt-4 md:mt-0">
            {['recipes', 'ingredients'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 capitalize ${
                  activeTab === tab
                    ? 'bg-[#823A1E] text-white shadow-md'
                    : 'text-[#8C7B70] dark:text-[#A09080] hover:bg-[#E6DCC8] dark:hover:bg-[#3E3430]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ================= RECIPES TAB ================= */}
        {activeTab === 'recipes' && (
          <div className="grid gap-6">
             <div className="flex justify-between items-center bg-white dark:bg-[#241E1C] p-6 rounded-xl shadow-sm border border-[#E6DCC8] dark:border-[#423630]">
               <div>
                 <h2 className="text-xl font-bold text-[#4A403A] dark:text-[#E6DCC8]">Menu Recipes</h2>
                 <p className="text-sm text-[#8C7B70]">Track costs per cup and set your prices.</p>
               </div>
               <button onClick={() => setShowNewRecipe(true)} className="flex items-center gap-2 bg-[#823A1E] hover:bg-[#682D16] text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
                 <PlusCircle className="w-5 h-5" /> Add Recipe
               </button>
             </div>

             {/* CREATE NEW RECIPE FORM */}
             {showNewRecipe && (
               <div className="bg-white dark:bg-[#241E1C] p-6 rounded-xl shadow-lg border border-[#D4A373] dark:border-[#5C4D45] relative mb-6">
                 <button onClick={() => setShowNewRecipe(false)} className="absolute top-4 right-4 text-[#8C7B70] hover:text-[#823A1E]"><X className="w-6 h-6"/></button>
                 <h3 className="text-lg font-bold mb-4 text-[#823A1E] dark:text-[#D4A373]">Create New Recipe</h3>

                 <div className="grid md:grid-cols-2 gap-8">
                   {/* Left: Inputs */}
                   <div className="space-y-4">
                     <div>
                       <label className="block text-sm font-medium text-[#8C7B70] mb-1">Recipe Name</label>
                       <input type="text" placeholder="e.g. Iced Latte" value={newRecipe.name} onChange={e => setNewRecipe({...newRecipe, name: e.target.value})} className="w-full p-3 bg-[#FAF8F4] dark:bg-[#2C2420] border border-[#E6DCC8] dark:border-[#423630] rounded-lg dark:text-[#E6DCC8] focus:ring-2 focus:ring-[#823A1E] outline-none" />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-[#8C7B70] mb-1">Selling Price (₱)</label>
                       <input type="number" placeholder="0.00" value={newRecipe.sellingPrice} onChange={e => setNewRecipe({...newRecipe, sellingPrice: e.target.value})} className="w-full p-3 bg-[#FAF8F4] dark:bg-[#2C2420] border border-[#E6DCC8] dark:border-[#423630] rounded-lg dark:text-[#E6DCC8] focus:ring-2 focus:ring-[#823A1E] outline-none" />
                     </div>

                     <div>
                       <label className="block text-sm font-medium text-[#8C7B70] mb-1">Recipe Photo (Optional)</label>
                       <div className="flex items-center gap-4">
                         {newRecipe.imageBase64 && (
                           <img src={newRecipe.imageBase64} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-[#E6DCC8] dark:border-[#423630]" />
                         )}
                         <label className="flex items-center gap-2 px-4 py-2 bg-[#FAF8F4] dark:bg-[#2C2420] border border-[#E6DCC8] dark:border-[#423630] rounded-lg cursor-pointer hover:bg-[#EFEBE4] dark:hover:bg-[#3E3430] transition-colors text-sm text-[#8C7B70]">
                           <Camera className="w-4 h-4" />
                           {newRecipe.imageBase64 ? 'Change Photo' : 'Upload Photo'}
                           <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                         </label>
                         {newRecipe.imageBase64 && (
                           <button onClick={() => setNewRecipe({ ...newRecipe, imageBase64: null })} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                         )}
                       </div>
                     </div>

                     <div className="space-y-2 pt-2">
                       <label className="text-sm font-semibold text-[#8C7B70] flex justify-between">
                         <span>Ingredients</span>
                         <span className="text-xs font-normal">Amount in ml/g</span>
                       </label>
                       {newRecipe.ingredients.map((ing, idx) => {
                         const selectedIng = ingredients.find(i => i.id == ing.ingredientId);
                         const lineCost = selectedIng ? (parseFloat(selectedIng.costPerBaseUnit) * (parseFloat(ing.quantity) || 0)) : 0;

                         return (
                           <div key={idx} className="flex gap-2 items-center bg-[#FAF8F4] dark:bg-[#2C2420]/50 p-2 rounded-lg border border-[#E6DCC8] dark:border-[#423630]">
                             {/* Ingredient Dropdown */}
                             <select value={ing.ingredientId} onChange={e => updateRecipeIngredient(idx, 'ingredientId', e.target.value)} className="flex-1 p-2 bg-white dark:bg-[#2C2420] border border-[#E6DCC8] dark:border-[#423630] rounded-lg dark:text-[#E6DCC8] focus:outline-none">
                               <option value="">Select Item...</option>
                               {ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                             </select>

                             {/* Quantity Input */}
                             <div className="relative w-28">
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={ing.quantity}
                                  onChange={e => updateRecipeIngredient(idx, 'quantity', e.target.value)}
                                  className="w-full p-2 bg-white dark:bg-[#2C2420] border border-[#E6DCC8] dark:border-[#423630] rounded-lg dark:text-[#E6DCC8] text-right pr-8 focus:outline-none"
                                />
                                <span className="absolute right-2 top-2 text-xs text-[#8C7B70]">{selectedIng?.baseUnit || 'unit'}</span>
                             </div>

                             {/* Live Cost Display */}
                             <div className="w-20 text-right text-xs font-mono text-[#8C7B70]">
                               ₱{lineCost.toFixed(2)}
                             </div>

                             <button onClick={() => removeRecipeIngredient(idx)} className="text-[#8C7B70] hover:text-red-500 p-2"><Trash2 className="w-4 h-4"/></button>
                           </div>
                         );
                       })}
                       <button onClick={addRecipeIngredient} className="text-sm text-[#823A1E] dark:text-[#D4A373] font-medium hover:underline flex items-center gap-1 mt-2">
                         <PlusCircle className="w-4 h-4" /> Add Ingredient
                       </button>
                     </div>
                   </div>

                   {/* Right: Preview Card */}
                   <div className="bg-[#FAF8F4] dark:bg-[#2C2420] p-6 rounded-xl flex flex-col justify-between h-full border border-[#E6DCC8] dark:border-[#423630]">
                     <div>
                        <h4 className="font-bold text-[#8C7B70] uppercase text-xs mb-4 tracking-wider">Profit Analysis</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-[#8C7B70]">Total Ingredient Cost</span>
                                <span className="font-mono font-medium text-[#4A403A] dark:text-[#E6DCC8]">₱{formRecipeCost.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[#8C7B70]">Selling Price</span>
                                <span className="font-mono font-medium text-[#4A403A] dark:text-[#E6DCC8]">₱{formSellingPrice.toFixed(2)}</span>
                            </div>
                            <div className="h-px bg-[#E6DCC8] dark:bg-[#423630] my-2"></div>
                            <div className="flex justify-between font-bold text-xl">
                                <span className="text-[#4A403A] dark:text-[#E6DCC8]">Net Profit</span>
                                <span className={formProfit >= 0 ? "text-green-600" : "text-red-600"}>₱{formProfit.toFixed(2)}</span>
                            </div>
                            <div className="text-right text-xs text-[#8C7B70] mt-1">
                                Margin: {formSellingPrice ? ((formProfit / formSellingPrice) * 100).toFixed(1) : 0}%
                            </div>
                        </div>
                     </div>

                     <div className="flex gap-3 mt-8">
                       <button onClick={handleAddRecipe} className="flex-1 bg-[#823A1E] hover:bg-[#682D16] text-white py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2">
                         <Save className="w-5 h-5" /> Save Recipe
                       </button>
                     </div>
                   </div>
                 </div>
               </div>
             )}

             {/* RECIPE LIST CARD */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {recipes.map(recipe => {
                 const recipeIngredients = recipe.ingredients || [];
                 const cost = calculateRecipeCost(recipeIngredients);
                 const price = parseFloat(recipe.sellingPrice) || 0;
                 const profit = price - cost;
                 const margin = price > 0 ? ((profit / price) * 100) : 0;

                 return (
                   <div key={recipe.id} className="bg-white dark:bg-[#241E1C] rounded-xl shadow-sm border border-[#E6DCC8] dark:border-[#423630] flex flex-col justify-between hover:shadow-md transition-shadow group overflow-hidden">
                     
                     {/* Image Header if available */}
                     {recipe.image && (
                       <div className="h-40 w-full overflow-hidden bg-[#FAF8F4] dark:bg-[#2C2420]">
                         <img src={recipe.image} alt={recipe.drinkName || recipe.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                       </div>
                     )}

                     <div className="p-6 pb-0">
                       <div className="flex justify-between items-start mb-4">
                         <h3 className="font-bold text-xl text-[#4A403A] dark:text-[#E6DCC8]">
                           {recipe.drinkName || recipe.name}
                         </h3>
                         <div className="flex gap-2">
                           <button onClick={() => handleExportPDF(recipe)} title="Export PDF" className="text-[#8C7B70] hover:text-[#823A1E] transition-colors">
                             <FileDown className="w-5 h-5" />
                           </button>
                           <button onClick={() => handleDeleteRecipe(recipe.id)} title="Delete" className="text-[#E6DCC8] group-hover:text-red-500 transition-colors">
                             <Trash2 className="w-5 h-5" />
                           </button>
                         </div>
                       </div>

                       <div className="space-y-2 mb-6 bg-[#FAF8F4] dark:bg-[#2C2420] p-3 rounded-lg min-h-[80px]">
                         {recipeIngredients.map((ri, i) => {
                           const idToFind = ri.ingredientId || (ri.ingredient ? ri.ingredient.id : null);
                           const ing = ingredients.find(x => x.id === idToFind);

                           return (
                             <div key={i} className="text-xs text-[#8C7B70] flex justify-between border-b border-dashed border-[#E6DCC8] dark:border-[#423630] last:border-0 pb-1 last:pb-0">
                               <span>{ing?.name || 'Unknown Item'}</span>
                               <span>{ri.quantity} {ing?.baseUnit}</span>
                             </div>
                           );
                         })}
                       </div>
                     </div>

                     <div className="grid grid-cols-3 gap-2 p-6 pt-4 border-t border-[#E6DCC8] dark:border-[#423630]">
                       <div className="text-center">
                         <p className="text-[10px] text-[#8C7B70] uppercase tracking-wide">Cost</p>
                         <p className="font-bold text-[#4A403A] dark:text-[#E6DCC8]">₱{cost.toFixed(2)}</p>
                       </div>
                       <div className="text-center">
                         <p className="text-[10px] text-[#8C7B70] uppercase tracking-wide">Price</p>
                         <p className="font-bold text-[#4A403A] dark:text-[#E6DCC8]">₱{price.toFixed(2)}</p>
                       </div>
                       <div className="text-center">
                         <p className="text-[10px] text-[#8C7B70] uppercase tracking-wide">Margin</p>
                         <p className={`font-bold ${margin >= 40 ? 'text-green-600' : 'text-[#D4A373]'}`}>{margin.toFixed(0)}%</p>
                       </div>
                     </div>
                   </div>
                 )
               })}
             </div>
          </div>
        )}

        {/* ================= INGREDIENTS TAB ================= */}
        {activeTab === 'ingredients' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#241E1C] p-6 rounded-xl shadow-sm border border-[#E6DCC8] dark:border-[#423630] flex flex-row justify-between items-center">
               <div>
                 <h2 className="text-xl font-bold text-[#4A403A] dark:text-[#E6DCC8]">Inventory Items</h2>
                 <p className="text-sm text-[#8C7B70]">Auto-converts Liters to ml and kg to grams.</p>
               </div>
              <button onClick={() => setShowNewIngredient(true)} className="flex items-center gap-2 bg-[#823A1E] hover:bg-[#682D16] text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
                <PlusCircle className="w-5 h-5" /> Add Ingredient
              </button>
            </div>

            {/* CREATE INGREDIENT FORM */}
            {showNewIngredient && (
              <div className="bg-white dark:bg-[#241E1C] p-6 rounded-xl shadow-lg border border-[#D4A373] dark:border-[#5C4D45] relative mb-6">
                <button onClick={() => setShowNewIngredient(false)} className="absolute top-4 right-4 text-[#8C7B70] hover:text-[#823A1E]"><X className="w-6 h-6"/></button>
                <h3 className="text-lg font-bold mb-6 text-[#823A1E] dark:text-[#D4A373]">Add New Inventory Item</h3>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-[#8C7B70] mb-1">Item Name</label>
                    <input type="text" placeholder="e.g. Full Cream Milk" value={newIngredient.name} onChange={e => setNewIngredient({...newIngredient, name: e.target.value})} className="w-full p-3 bg-[#FAF8F4] dark:bg-[#2C2420] border border-[#E6DCC8] dark:border-[#423630] rounded-lg dark:text-[#E6DCC8] focus:ring-2 focus:ring-[#823A1E] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8C7B70] mb-1">Category</label>
                    <select value={newIngredient.category} onChange={e => setNewIngredient({...newIngredient, category: e.target.value})} className="w-full p-3 bg-[#FAF8F4] dark:bg-[#2C2420] border border-[#E6DCC8] dark:border-[#423630] rounded-lg dark:text-[#E6DCC8] focus:ring-2 focus:ring-[#823A1E] outline-none">
                      {['Beans','Milk','Syrup','Powder','Sauce','Topping','Packaging'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-[#8C7B70] mb-1">Pack Size (Qty)</label>
                    <input type="number" placeholder="e.g. 1" value={newIngredient.packSize} onChange={e => setNewIngredient({...newIngredient, packSize: e.target.value})} className="w-full p-3 bg-[#FAF8F4] dark:bg-[#2C2420] border border-[#E6DCC8] dark:border-[#423630] rounded-lg dark:text-[#E6DCC8] focus:ring-2 focus:ring-[#823A1E] outline-none" />
                    <p className="text-[10px] text-[#8C7B70] mt-1">Example: Enter "1" for 1 Liter.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8C7B70] mb-1">Pack Unit</label>
                    <select value={newIngredient.baseUnit} onChange={e => setNewIngredient({...newIngredient, baseUnit: e.target.value})} className="w-full p-3 bg-[#FAF8F4] dark:bg-[#2C2420] border border-[#E6DCC8] dark:border-[#423630] rounded-lg dark:text-[#E6DCC8] focus:ring-2 focus:ring-[#823A1E] outline-none">
                      <option value="ml">ml (Milliliters)</option>
                      <option value="g">g (Grams)</option>
                      <option value="L">L (Liters) - Auto Converts</option>
                      <option value="kg">kg (Kilograms) - Auto Converts</option>
                      <option value="pc">pc (Pieces)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8C7B70] mb-1">Total Price (₱)</label>
                    <input type="number" placeholder="e.g. 250" value={newIngredient.packPrice} onChange={e => setNewIngredient({...newIngredient, packPrice: e.target.value})} className="w-full p-3 bg-[#FAF8F4] dark:bg-[#2C2420] border border-[#E6DCC8] dark:border-[#423630] rounded-lg dark:text-[#E6DCC8] focus:ring-2 focus:ring-[#823A1E] outline-none" />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={handleAddIngredient} className="flex-1 bg-[#823A1E] hover:bg-[#682D16] text-white py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2">
                     <Save className="w-5 h-5"/> Save Item
                  </button>
                  <button onClick={() => setShowNewIngredient(false)} className="px-6 py-3 border border-[#E6DCC8] dark:border-[#423630] rounded-lg text-[#8C7B70] hover:bg-[#FAF8F4] dark:hover:bg-[#2C2420]">Cancel</button>
                </div>
              </div>
            )}

            {/* Ingredient List */}
            <div className="bg-white dark:bg-[#241E1C] rounded-xl shadow-sm border border-[#E6DCC8] dark:border-[#423630] overflow-hidden">
              <div className="p-4 border-b border-[#E6DCC8] dark:border-[#423630] flex gap-2 overflow-x-auto">
                {['All', 'Beans', 'Milk', 'Syrup', 'Powder', 'Sauce', 'Topping', 'Packaging'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      categoryFilter === cat
                        ? 'bg-[#823A1E] text-white'
                        : 'bg-[#FAF8F4] dark:bg-[#2C2420] text-[#8C7B70] hover:bg-[#E6DCC8] dark:hover:bg-[#3E3430]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAF8F4] dark:bg-[#2C2420] text-[#8C7B70] text-sm border-b border-[#E6DCC8] dark:border-[#423630]">
                      <th className="p-4 font-medium">Name</th>
                      <th className="p-4 font-medium">Category</th>
                      <th className="p-4 font-medium">Pack Size</th>
                      <th className="p-4 font-medium">Total Price</th>
                      <th className="p-4 font-medium">Cost / Unit</th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIngredients.map(ing => (
                      <tr key={ing.id} className="border-b border-[#E6DCC8] dark:border-[#423630] last:border-0 hover:bg-[#FAF8F4] dark:hover:bg-[#2C2420]/50 transition-colors">
                        <td className="p-4 text-[#4A403A] dark:text-[#E6DCC8] font-medium">{ing.name}</td>
                        <td className="p-4 text-[#8C7B70] text-sm">{ing.category}</td>
                        <td className="p-4 text-[#8C7B70] text-sm">{ing.packSize} {ing.baseUnit}</td>
                        <td className="p-4 text-[#8C7B70] text-sm">₱{parseFloat(ing.packPrice).toFixed(2)}</td>
                        <td className="p-4 font-mono text-sm text-[#4A403A] dark:text-[#E6DCC8]">₱{parseFloat(ing.costPerBaseUnit).toFixed(4)} / {ing.baseUnit}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => handleDeleteIngredient(ing.id)} className="text-[#8C7B70] hover:text-red-500 transition-colors">
                            <Trash2 className="w-5 h-5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredIngredients.length === 0 && (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-[#8C7B70]">No ingredients found in this category.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}