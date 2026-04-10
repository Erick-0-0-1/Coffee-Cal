import { useState, useEffect } from 'react';
import { TrendingUp, Calculator, DollarSign, BarChart3, PieChart, Coffee, Target, AlertCircle, CheckCircle2, ArrowRight, PlusCircle, Trash2, Search } from 'lucide-react';
import api from '../services/api';

export default function Statistics() {
  const [viewMode, setViewMode] = useState('cost'); // 'business' or 'cost'

  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);

  // Business Analysis State
  const [businessStats, setBusinessStats] = useState({
    daysOpen: 26,
    rent: 15000,
    payroll: 20000,
    utilities: 5000,
    misc: 2000
  });
  
  // New: Sales Mix for Projections [{ recipeId: '', cupsPerDay: 0 }]
  const [projectedSales, setProjectedSales] = useState([]);

  // Cost Analysis State
  const [targetMargin, setTargetMargin] = useState(75);
  const [selectedRecipeId, setSelectedRecipeId] = useState(''); // For Deep Dive

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

  const updateBusinessStat = (field, value) => {
    setBusinessStats(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  // --- PRE-COMPUTATIONS (Base Data) ---
  // FIX 1: Removed the `> 0` filter so even test recipes with no ingredients (₱0 price) will show up!
  const activeRecipes = recipes; 
  
  // Sort and analyze all recipes
  const sortedRecipes = [...activeRecipes].map(r => {
    const cost = calculateRecipeCost(r.ingredients);
    // FIX 2: Updated to suggestedSellingPrice and added a fallback to 0
    const price = parseFloat(r.suggestedSellingPrice) || 0; 
    const profit = price - cost;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    const suggestedPrice = cost > 0 ? cost / (1 - (targetMargin / 100)) : 0;
    const meetsTarget = margin >= targetMargin;
    return { ...r, cost, price, profit, margin, suggestedPrice, meetsTarget };
  }).sort((a, b) => b.margin - a.margin);

  // --- BUSINESS PROJECTION MATH ---
  const monthlyDays = businessStats.daysOpen;
  let projectedRevenue = 0;
  let projectedCOGS = 0;
  let totalMonthlyCups = 0;

  projectedSales.forEach(sale => {
    const recipe = sortedRecipes.find(r => r.id.toString() === sale.recipeId.toString());
    if (recipe) {
      const dailyQty = parseFloat(sale.cupsPerDay) || 0;
      const monthlyQty = dailyQty * monthlyDays;
      totalMonthlyCups += monthlyQty;
      projectedRevenue += monthlyQty * recipe.price;
      projectedCOGS += monthlyQty * recipe.cost;
    }
  });

  const grossProfit = projectedRevenue - projectedCOGS;
  const totalFixedExpenses = businessStats.rent + businessStats.payroll + businessStats.utilities + businessStats.misc;
  const netProfit = grossProfit - totalFixedExpenses;
  const businessMargin = projectedRevenue > 0 ? ((netProfit / projectedRevenue) * 100) : 0;

  // --- BUSINESS PROJECTION ACTIONS ---
  const addProjectedSale = () => setProjectedSales([...projectedSales, { recipeId: '', cupsPerDay: '' }]);
  const updateProjectedSale = (index, field, value) => {
    const newSales = [...projectedSales];
    newSales[index][field] = value;
    setProjectedSales(newSales);
  };
  const removeProjectedSale = (index) => setProjectedSales(projectedSales.filter((_, i) => i !== index));

  // --- COST ANALYSIS MATH ---
  // FIX 3: Updated sellingPrice to suggestedSellingPrice here as well
  const avgSellingPrice = activeRecipes.length > 0 ? (activeRecipes.reduce((sum, r) => sum + (parseFloat(r.suggestedSellingPrice) || 0), 0) / activeRecipes.length) : 0;
  const avgCostPerCup = activeRecipes.length > 0 ? (activeRecipes.reduce((sum, r) => sum + calculateRecipeCost(r.ingredients || []), 0) / activeRecipes.length) : 0;
  const overallAverageMargin = avgSellingPrice > 0 ? (((avgSellingPrice - avgCostPerCup) / avgSellingPrice) * 100) : 0;
  const overallCOGSPercentage = avgSellingPrice > 0 ? ((avgCostPerCup / avgSellingPrice) * 100) : 0;

  const failingRecipesCount = sortedRecipes.filter(r => !r.meetsTarget).length;
  const selectedRecipeData = selectedRecipeId ? sortedRecipes.find(r => r.id.toString() === selectedRecipeId.toString()) : null;


  return (
    <div className="rounded-xl min-h-screen bg-[#FDFBF7] dark:bg-[#1A1412] transition-colors duration-200 font-sans text-[#4A403A] dark:text-[#E6DCC8]">
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* --- TOP HEADER & GLOBAL VIEW TOGGLE --- */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-[#E6DCC8] dark:border-[#423630] pb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#823A1E] dark:text-[#D4A373] flex items-center gap-2">
              <BarChart3 className="w-8 h-8"/> Statistics & Reports
            </h1>
            <p className="text-[#8C7B70] dark:text-[#A09080] mt-1">
              {viewMode === 'business' ? 'Monthly Revenue Projections Based on Sales Mix' : 'Menu Profitability & Cost Breakdown'}
            </p>
          </div>

          <div className="flex bg-[#EFEBE4] dark:bg-[#2C2420] p-1 rounded-xl shadow-sm border border-[#E6DCC8] dark:border-[#423630] mt-4 md:mt-0">
            <button
              onClick={() => setViewMode('cost')}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                viewMode === 'cost'
                  ? 'bg-[#823A1E] text-white shadow-md'
                  : 'text-[#8C7B70] dark:text-[#A09080] hover:bg-[#E6DCC8] dark:hover:bg-[#3E3430]'
              }`}
            >
              Cost Analysis
            </button>
            <button
              onClick={() => setViewMode('business')}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                viewMode === 'business'
                  ? 'bg-[#823A1E] text-white shadow-md'
                  : 'text-[#8C7B70] dark:text-[#A09080] hover:bg-[#E6DCC8] dark:hover:bg-[#3E3430]'
              }`}
            >
              Business Analysis
            </button>
          </div>
        </div>

        {/* ================= COST ANALYSIS MODE ================= */}
        {viewMode === 'cost' && (
          <div className="space-y-6">
            
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#241E1C] p-6 rounded-xl shadow-sm border border-[#E6DCC8] dark:border-[#423630]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[#FAF8F4] dark:bg-[#2C2420] rounded-lg text-[#823A1E] dark:text-[#D4A373]">
                    <PieChart className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold text-[#8C7B70] uppercase tracking-wider">Avg Gross Margin</h3>
                </div>
                <p className="text-3xl font-bold text-[#4A403A] dark:text-[#E6DCC8]">{overallAverageMargin.toFixed(1)}%</p>
              </div>

              <div className="bg-white dark:bg-[#241E1C] p-6 rounded-xl shadow-sm border border-[#E6DCC8] dark:border-[#423630]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[#FAF8F4] dark:bg-[#2C2420] rounded-lg text-[#823A1E] dark:text-[#D4A373]">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold text-[#8C7B70] uppercase tracking-wider">Overall COGS %</h3>
                </div>
                <p className={`text-3xl font-bold ${overallCOGSPercentage > 30 ? 'text-red-500' : 'text-[#4A403A] dark:text-[#E6DCC8]'}`}>
                  {overallCOGSPercentage.toFixed(1)}%
                </p>
                <p className="text-[10px] text-[#8C7B70] mt-1">Industry target: 15-25%</p>
              </div>

              <div className="bg-white dark:bg-[#241E1C] p-6 rounded-xl shadow-sm border border-[#E6DCC8] dark:border-[#423630]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[#FAF8F4] dark:bg-[#2C2420] rounded-lg text-[#823A1E] dark:text-[#D4A373]">
                    <Coffee className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold text-[#8C7B70] uppercase tracking-wider">Avg Cost Per Cup</h3>
                </div>
                <p className="text-3xl font-bold text-[#4A403A] dark:text-[#E6DCC8]">₱{avgCostPerCup.toFixed(2)}</p>
              </div>

              <div className="bg-white dark:bg-[#241E1C] p-6 rounded-xl shadow-sm border border-[#E6DCC8] dark:border-[#423630]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[#FAF8F4] dark:bg-[#2C2420] rounded-lg text-[#823A1E] dark:text-[#D4A373]">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold text-[#8C7B70] uppercase tracking-wider">Avg Selling Price</h3>
                </div>
                <p className="text-3xl font-bold text-[#4A403A] dark:text-[#E6DCC8]">₱{avgSellingPrice.toFixed(2)}</p>
              </div>
            </div>

            {/* RECIPE DEEP DIVE (NEW) */}
            <div className="bg-white dark:bg-[#241E1C] p-6 rounded-xl shadow-sm border border-[#E6DCC8] dark:border-[#423630]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Search className="w-6 h-6 text-[#823A1E] dark:text-[#D4A373]"/>
                  <h2 className="text-xl font-bold text-[#4A403A] dark:text-[#E6DCC8]">Recipe Deep Dive</h2>
                </div>
                <select 
                  value={selectedRecipeId} 
                  onChange={(e) => setSelectedRecipeId(e.target.value)}
                  className="w-full md:w-72 p-3 bg-[#FAF8F4] dark:bg-[#2C2420] border border-[#E6DCC8] dark:border-[#423630] rounded-lg dark:text-[#E6DCC8] focus:ring-2 focus:ring-[#823A1E] outline-none"
                >
                  <option value="">Select a recipe to analyze...</option>
                  {sortedRecipes.map(r => (
                    <option key={r.id} value={r.id}>{r.drinkName || r.name}</option>
                  ))}
                </select>
              </div>

              {selectedRecipeData ? (
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Ingredient Breakdown */}
                  <div className="bg-[#FAF8F4] dark:bg-[#2C2420]/50 p-4 rounded-xl border border-[#E6DCC8] dark:border-[#423630]">
                    <h3 className="text-sm font-bold text-[#8C7B70] uppercase tracking-wider mb-4 border-b border-[#E6DCC8] dark:border-[#423630] pb-2">Ingredient Cost Breakdown</h3>
                    <div className="space-y-3">
                      {(selectedRecipeData.ingredients || []).map((ri, i) => {
                        const idToFind = ri.ingredientId || (ri.ingredient ? ri.ingredient.id : null);
                        const ing = ingredients.find(x => x.id == idToFind);
                        const lineCost = ing ? (parseFloat(ing.costPerBaseUnit) * parseFloat(ri.quantity || 0)) : 0;
                        return (
                          <div key={i} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2 text-[#4A403A] dark:text-[#E6DCC8]">
                              <span className="font-medium">{ing?.name || 'Unknown'}</span>
                              <span className="text-xs text-[#8C7B70]">({ri.quantity}{ing?.baseUnit})</span>
                            </div>
                            <span className="font-mono text-[#8C7B70]">₱{lineCost.toFixed(2)}</span>
                          </div>
                        );
                      })}
                      <div className="pt-3 mt-3 border-t border-dashed border-[#E6DCC8] dark:border-[#423630] flex justify-between font-bold">
                        <span className="text-[#823A1E] dark:text-[#D4A373]">Total Cost</span>
                        <span className="font-mono text-[#4A403A] dark:text-[#E6DCC8]">₱{selectedRecipeData.cost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Profitability Snapshot */}
                  <div className="flex flex-col justify-center space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#FAF8F4] dark:bg-[#2C2420] p-4 rounded-lg border border-[#E6DCC8] dark:border-[#423630] text-center">
                           <p className="text-[10px] text-[#8C7B70] uppercase tracking-wide">Selling Price</p>
                           <p className="text-2xl font-bold text-[#4A403A] dark:text-[#E6DCC8]">₱{selectedRecipeData.price.toFixed(2)}</p>
                        </div>
                        <div className="bg-[#FAF8F4] dark:bg-[#2C2420] p-4 rounded-lg border border-[#E6DCC8] dark:border-[#423630] text-center">
                           <p className="text-[10px] text-[#8C7B70] uppercase tracking-wide">Gross Profit</p>
                           <p className="text-2xl font-bold text-green-600 dark:text-green-400">₱{selectedRecipeData.profit.toFixed(2)}</p>
                        </div>
                     </div>
                     <div className="p-4 rounded-lg border flex justify-between items-center bg-white dark:bg-[#241E1C] border-[#E6DCC8] dark:border-[#423630]">
                        <div>
                           <p className="text-sm font-semibold text-[#8C7B70]">Current Margin</p>
                           <p className={`text-xl font-bold ${selectedRecipeData.meetsTarget ? 'text-green-600' : 'text-red-500'}`}>
                             {selectedRecipeData.margin.toFixed(1)}%
                           </p>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-semibold text-[#8C7B70]">Target Pricing ({targetMargin}%)</p>
                           <p className="text-xl font-bold font-mono text-[#4A403A] dark:text-[#E6DCC8]">₱{selectedRecipeData.suggestedPrice.toFixed(2)}</p>
                        </div>
                     </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-[#8C7B70] bg-[#FAF8F4] dark:bg-[#2C2420]/30 rounded-xl border border-dashed border-[#E6DCC8] dark:border-[#423630]">
                  Select a recipe above to view its detailed cost analysis.
                </div>
              )}
            </div>

            {/* Menu Engineering & Profitability Matrix */}
            <div className="bg-white dark:bg-[#241E1C] rounded-xl shadow-sm border border-[#E6DCC8] dark:border-[#423630] overflow-hidden">
              <div className="p-6 border-b border-[#E6DCC8] dark:border-[#423630] bg-[#FAF8F4] dark:bg-[#2C2420] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#823A1E] dark:text-[#D4A373] flex items-center gap-2">
                    <Target className="w-6 h-6"/> Menu Engineering Matrix
                  </h2>
                  <p className="text-sm text-[#8C7B70] mt-1">
                    {failingRecipesCount > 0 
                      ? `${failingRecipesCount} recipes are below your target margin.` 
                      : 'All your recipes meet your target margin!'}
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-[#1A1412] p-3 rounded-lg border border-[#E6DCC8] dark:border-[#423630]">
                  <label className="text-sm font-medium text-[#8C7B70]">Target Margin %:</label>
                  <input 
                    type="number" 
                    value={targetMargin} 
                    onChange={(e) => setTargetMargin(e.target.value)}
                    className="w-20 p-2 bg-[#FAF8F4] dark:bg-[#2C2420] border border-[#E6DCC8] dark:border-[#423630] rounded-md font-bold text-[#823A1E] dark:text-[#D4A373] focus:outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-white dark:bg-[#241E1C] text-[#8C7B70] text-sm border-b border-[#E6DCC8] dark:border-[#423630]">
                      <th className="p-4 font-medium">Recipe Name</th>
                      <th className="p-4 font-medium">Recipe Cost</th>
                      <th className="p-4 font-medium">Current Price</th>
                      <th className="p-4 font-medium">Current Margin</th>
                      <th className="p-4 font-medium bg-[#FAF8F4] dark:bg-[#2C2420] text-center" colSpan="2">Target Pricing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRecipes.map(recipe => (
                      <tr key={recipe.id} className="border-b border-[#E6DCC8] dark:border-[#423630] last:border-0 hover:bg-[#FAF8F4] dark:hover:bg-[#2C2420]/50 transition-colors">
                        <td className="p-4 text-[#4A403A] dark:text-[#E6DCC8] font-bold">
                          {recipe.drinkName || recipe.name}
                        </td>
                        <td className="p-4 text-[#8C7B70] font-mono">₱{recipe.cost.toFixed(2)}</td>
                        <td className="p-4 text-[#4A403A] dark:text-[#E6DCC8] font-mono">₱{recipe.price.toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            recipe.meetsTarget 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {recipe.margin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-4 bg-[#FAF8F4]/50 dark:bg-[#2C2420]/50 border-l border-[#E6DCC8] dark:border-[#423630]">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-[#8C7B70] uppercase">Suggested</span>
                            <span className="font-bold text-[#823A1E] dark:text-[#D4A373] font-mono">
                              ₱{recipe.suggestedPrice.toFixed(2)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 bg-[#FAF8F4]/50 dark:bg-[#2C2420]/50">
                          {!recipe.meetsTarget && (
                            <div className="flex items-center gap-1 text-xs text-red-500 font-medium">
                              <ArrowRight className="w-3 h-3"/> Increase by ₱{(recipe.suggestedPrice - recipe.price).toFixed(2)}
                            </div>
                          )}
                          {recipe.meetsTarget && (
                            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                              <CheckCircle2 className="w-3 h-3"/> Optimal
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= BUSINESS ANALYSIS MODE (ENHANCED) ================= */}
        {viewMode === 'business' && (
          <div className="grid md:grid-cols-12 gap-6">
            
            {/* Left Column: Data Input */}
            <div className="md:col-span-7 space-y-6">
              
              {/* Sales Mix Builder */}
              <div className="bg-white dark:bg-[#241E1C] p-6 rounded-xl shadow-sm border border-[#E6DCC8] dark:border-[#423630]">
                <div className="flex justify-between items-center mb-6">
                   <div className="flex items-center gap-2">
                     <TrendingUp className="w-6 h-6 text-[#823A1E] dark:text-[#D4A373]"/>
                     <h2 className="text-xl font-bold text-[#4A403A] dark:text-[#E6DCC8]">Sales Mix Projection</h2>
                   </div>
                   <div className="flex items-center gap-2 text-sm bg-[#FAF8F4] dark:bg-[#2C2420] px-3 py-1.5 rounded-lg border border-[#E6DCC8] dark:border-[#423630]">
                     <span className="text-[#8C7B70]">Days Open / Month:</span>
                     <input 
                        type="number" 
                        value={businessStats.daysOpen} 
                        onChange={e => updateBusinessStat('daysOpen', e.target.value)} 
                        className="w-12 bg-transparent text-[#823A1E] dark:text-[#D4A373] font-bold focus:outline-none"
                     />
                   </div>
                </div>

                <div className="space-y-3">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-2 px-2 text-xs font-bold text-[#8C7B70] uppercase tracking-wider">
                     <div className="col-span-7">Select Drink</div>
                     <div className="col-span-4 text-center">Expected Cups / Day</div>
                     <div className="col-span-1"></div>
                  </div>

                  {/* Projected Items List */}
                  {projectedSales.map((sale, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-[#FAF8F4] dark:bg-[#2C2420]/50 p-2 rounded-lg border border-[#E6DCC8] dark:border-[#423630]">
                      <div className="col-span-7">
                        <select 
                          value={sale.recipeId} 
                          onChange={e => updateProjectedSale(idx, 'recipeId', e.target.value)} 
                          className="w-full p-2 bg-white dark:bg-[#2C2420] border border-[#E6DCC8] dark:border-[#423630] rounded-lg dark:text-[#E6DCC8] focus:outline-none text-sm"
                        >
                          <option value="">Select recipe...</option>
                          {sortedRecipes.map(r => <option key={r.id} value={r.id}>{r.drinkName || r.name} (₱{r.price.toFixed(2)})</option>)}
                        </select>
                      </div>
                      <div className="col-span-4">
                        <input
                          type="number"
                          placeholder="Qty"
                          value={sale.cupsPerDay}
                          onChange={e => updateProjectedSale(idx, 'cupsPerDay', e.target.value)}
                          className="w-full p-2 text-center bg-white dark:bg-[#2C2420] border border-[#E6DCC8] dark:border-[#423630] rounded-lg dark:text-[#E6DCC8] focus:outline-none text-sm"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button onClick={() => removeProjectedSale(idx)} className="text-[#8C7B70] hover:text-red-500 p-1"><Trash2 className="w-5 h-5"/></button>
                      </div>
                    </div>
                  ))}

                  {projectedSales.length === 0 && (
                     <div className="text-center py-6 text-sm text-[#8C7B70] border-2 border-dashed border-[#E6DCC8] dark:border-[#423630] rounded-lg">
                        Add items below to build your monthly revenue projection.
                     </div>
                  )}

                  <button onClick={addProjectedSale} className="text-sm text-[#823A1E] dark:text-[#D4A373] font-medium hover:underline flex items-center gap-1 mt-4">
                    <PlusCircle className="w-4 h-4" /> Add Drink to Projection
                  </button>
                </div>
              </div>

              {/* Fixed Expenses */}
              <div className="bg-white dark:bg-[#241E1C] p-6 rounded-xl shadow-sm border border-[#E6DCC8] dark:border-[#423630]">
                <div className="flex items-center gap-2 mb-6">
                   <Calculator className="w-6 h-6 text-[#823A1E] dark:text-[#D4A373]"/>
                   <h2 className="text-xl font-bold text-[#4A403A] dark:text-[#E6DCC8]">Monthly Fixed Expenses (₱)</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#8C7B70] mb-1">Rent</label>
                    <input type="number" value={businessStats.rent} onChange={e => updateBusinessStat('rent', e.target.value)} className="w-full p-3 bg-[#FAF8F4] dark:bg-[#2C2420] border border-[#E6DCC8] dark:border-[#423630] rounded-lg dark:text-[#E6DCC8] focus:ring-2 focus:ring-[#823A1E] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8C7B70] mb-1">Payroll / Salaries</label>
                    <input type="number" value={businessStats.payroll} onChange={e => updateBusinessStat('payroll', e.target.value)} className="w-full p-3 bg-[#FAF8F4] dark:bg-[#2C2420] border border-[#E6DCC8] dark:border-[#423630] rounded-lg dark:text-[#E6DCC8] focus:ring-2 focus:ring-[#823A1E] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8C7B70] mb-1">Utilities (Water/Electric)</label>
                    <input type="number" value={businessStats.utilities} onChange={e => updateBusinessStat('utilities', e.target.value)} className="w-full p-3 bg-[#FAF8F4] dark:bg-[#2C2420] border border-[#E6DCC8] dark:border-[#423630] rounded-lg dark:text-[#E6DCC8] focus:ring-2 focus:ring-[#823A1E] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8C7B70] mb-1">Miscellaneous</label>
                    <input type="number" value={businessStats.misc} onChange={e => updateBusinessStat('misc', e.target.value)} className="w-full p-3 bg-[#FAF8F4] dark:bg-[#2C2420] border border-[#E6DCC8] dark:border-[#423630] rounded-lg dark:text-[#E6DCC8] focus:ring-2 focus:ring-[#823A1E] outline-none" />
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Dashboard Panel */}
            <div className="md:col-span-5 bg-[#823A1E] dark:bg-[#241E1C] p-6 rounded-xl shadow-lg border border-[#682D16] dark:border-[#423630] text-white flex flex-col justify-between">
               <div>
                  <div className="flex items-center gap-2 mb-8">
                     <DollarSign className="w-6 h-6 text-[#D4A373]"/>
                     <h2 className="text-xl font-bold">Monthly Profit Report</h2>
                  </div>

                  <div className="bg-white/10 rounded-lg p-3 mb-6 flex justify-between items-center text-sm">
                     <span className="text-white/80">Projected Monthly Volume:</span>
                     <span className="font-bold">{totalMonthlyCups.toLocaleString()} Cups</span>
                  </div>

                  <div className="space-y-4">
                     <div className="flex justify-between border-b border-white/20 pb-2">
                        <span className="text-white/80 text-sm">Estimated Total Revenue</span>
                        <span className="font-mono font-medium">₱{projectedRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                     </div>
                     <div className="flex justify-between border-b border-white/20 pb-2">
                        <span className="text-white/80 text-sm">Ingredient Cost (COGS)</span>
                        <span className="font-mono font-medium text-red-300">- ₱{projectedCOGS.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                     </div>
                     <div className="flex justify-between border-b border-white/20 pb-2">
                        <span className="text-white/80 text-sm">Gross Profit</span>
                        <span className="font-mono font-medium text-green-300">₱{grossProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                     </div>
                     <div className="flex justify-between border-b border-white/20 pb-2">
                        <span className="text-white/80 text-sm">Total Fixed Expenses</span>
                        <span className="font-mono font-medium text-red-300">- ₱{totalFixedExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                     </div>
                  </div>
               </div>

               <div className="mt-8 bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-sm">
                  <p className="text-xs text-white/70 uppercase tracking-widest font-semibold mb-1">Estimated Net Profit</p>
                  <p className={`text-4xl font-bold font-mono ${netProfit >= 0 ? 'text-[#D4A373]' : 'text-red-400'}`}>
                     ₱{netProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </p>
                  <div className="flex justify-between items-center mt-2 text-sm text-white/80">
                     <span>Net Margin</span>
                     <span>{businessMargin.toFixed(1)}%</span>
                  </div>
               </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}