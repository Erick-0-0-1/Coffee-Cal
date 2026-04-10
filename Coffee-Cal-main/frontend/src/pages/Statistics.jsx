import { useState, useEffect } from 'react';
import { TrendingUp, Calculator, DollarSign, BarChart3, PieChart, Coffee } from 'lucide-react';
import api from '../services/api';

export default function Statistics() {
  // Top-level View Mode
  const [viewMode, setViewMode] = useState('business'); // 'business' or 'cost'

  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);

  // Business Analysis State
  const [businessStats, setBusinessStats] = useState({
    cupsPerDay: 50,
    daysOpen: 26,
    rent: 15000,
    payroll: 20000,
    utilities: 5000,
    misc: 2000
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

  const updateBusinessStat = (field, value) => {
    setBusinessStats(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  // --- COMPUTATIONS ---
  const activeRecipes = recipes.filter(r => parseFloat(r.sellingPrice) > 0);
  const avgSellingPrice = activeRecipes.length > 0 ? (activeRecipes.reduce((sum, r) => sum + parseFloat(r.sellingPrice || 0), 0) / activeRecipes.length) : 0;
  const avgCostPerCup = activeRecipes.length > 0 ? (activeRecipes.reduce((sum, r) => sum + calculateRecipeCost(r.ingredients || []), 0) / activeRecipes.length) : 0;
  
  // Business Math
  const monthlyCupsSold = businessStats.cupsPerDay * businessStats.daysOpen;
  const projectedRevenue = monthlyCupsSold * avgSellingPrice;
  const projectedCOGS = monthlyCupsSold * avgCostPerCup; 
  const grossProfit = projectedRevenue - projectedCOGS;
  const totalFixedExpenses = businessStats.rent + businessStats.payroll + businessStats.utilities + businessStats.misc;
  const netProfit = grossProfit - totalFixedExpenses;
  const businessMargin = projectedRevenue > 0 ? ((netProfit / projectedRevenue) * 100) : 0;

  // Cost Analysis Math
  const overallAverageMargin = avgSellingPrice > 0 ? (((avgSellingPrice - avgCostPerCup) / avgSellingPrice) * 100) : 0;

  // Find most/least profitable recipes
  const sortedRecipes = [...activeRecipes].map(r => {
    const cost = calculateRecipeCost(r.ingredients);
    const price = parseFloat(r.sellingPrice);
    const profit = price - cost;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    return { ...r, cost, price, profit, margin };
  }).sort((a, b) => b.margin - a.margin);

  const highestMarginRecipe = sortedRecipes[0];
  const lowestMarginRecipe = sortedRecipes[sortedRecipes.length - 1];

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
              {viewMode === 'business' ? 'Monthly Revenue & Expense Projections' : 'Menu Profitability & Cost Breakdown'}
            </p>
          </div>

          <div className="flex bg-[#EFEBE4] dark:bg-[#2C2420] p-1 rounded-xl shadow-sm border border-[#E6DCC8] dark:border-[#423630] mt-4 md:mt-0">
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
          </div>
        </div>

        {/* ================= BUSINESS ANALYSIS MODE ================= */}
        {viewMode === 'business' && (
          <div className="grid md:grid-cols-12 gap-6">
            
            {/* Left Column: Data Input */}
            <div className="md:col-span-7 space-y-6">
              
              <div className="bg-white dark:bg-[#241E1C] p-6 rounded-xl shadow-sm border border-[#E6DCC8] dark:border-[#423630]">
                <div className="flex items-center gap-2 mb-6">
                   <TrendingUp className="w-6 h-6 text-[#823A1E] dark:text-[#D4A373]"/>
                   <h2 className="text-xl font-bold text-[#4A403A] dark:text-[#E6DCC8]">Sales Projections</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#8C7B70] mb-1">Expected Cups Sold / Day</label>
                    <input type="number" value={businessStats.cupsPerDay} onChange={e => updateBusinessStat('cupsPerDay', e.target.value)} className="w-full p-3 bg-[#FAF8F4] dark:bg-[#2C2420] border border-[#E6DCC8] dark:border-[#423630] rounded-lg dark:text-[#E6DCC8] focus:ring-2 focus:ring-[#823A1E] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8C7B70] mb-1">Operating Days / Month</label>
                    <input type="number" value={businessStats.daysOpen} onChange={e => updateBusinessStat('daysOpen', e.target.value)} className="w-full p-3 bg-[#FAF8F4] dark:bg-[#2C2420] border border-[#E6DCC8] dark:border-[#423630] rounded-lg dark:text-[#E6DCC8] focus:ring-2 focus:ring-[#823A1E] outline-none" />
                  </div>
                </div>
                <div className="mt-4 p-4 bg-[#FAF8F4] dark:bg-[#2C2420] rounded-lg border border-[#E6DCC8] dark:border-[#423630] flex justify-between text-sm">
                   <span className="text-[#8C7B70]">Auto-calculated Avg Cup Price</span>
                   <span className="font-mono font-medium text-[#4A403A] dark:text-[#E6DCC8]">₱{avgSellingPrice.toFixed(2)}</span>
                </div>
              </div>

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

        {/* ================= COST ANALYSIS MODE ================= */}
        {viewMode === 'cost' && (
          <div className="space-y-6">
            
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-[#241E1C] p-6 rounded-xl shadow-sm border border-[#E6DCC8] dark:border-[#423630]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[#FAF8F4] dark:bg-[#2C2420] rounded-lg text-[#823A1E] dark:text-[#D4A373]">
                    <PieChart className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#8C7B70] uppercase tracking-wider">Avg Menu Margin</h3>
                </div>
                <p className="text-3xl font-bold text-[#4A403A] dark:text-[#E6DCC8]">{overallAverageMargin.toFixed(1)}%</p>
              </div>

              <div className="bg-white dark:bg-[#241E1C] p-6 rounded-xl shadow-sm border border-[#E6DCC8] dark:border-[#423630]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[#FAF8F4] dark:bg-[#2C2420] rounded-lg text-[#823A1E] dark:text-[#D4A373]">
                    <Coffee className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#8C7B70] uppercase tracking-wider">Avg Cost Per Cup</h3>
                </div>
                <p className="text-3xl font-bold text-[#4A403A] dark:text-[#E6DCC8]">₱{avgCostPerCup.toFixed(2)}</p>
              </div>

              <div className="bg-white dark:bg-[#241E1C] p-6 rounded-xl shadow-sm border border-[#E6DCC8] dark:border-[#423630]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[#FAF8F4] dark:bg-[#2C2420] rounded-lg text-[#823A1E] dark:text-[#D4A373]">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#8C7B70] uppercase tracking-wider">Avg Selling Price</h3>
                </div>
                <p className="text-3xl font-bold text-[#4A403A] dark:text-[#E6DCC8]">₱{avgSellingPrice.toFixed(2)}</p>
              </div>
            </div>

            {/* Profitability Rankings */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-[#241E1C] p-6 rounded-xl shadow-sm border border-[#E6DCC8] dark:border-[#423630]">
                <h3 className="font-bold text-[#823A1E] dark:text-[#D4A373] mb-4">Highest Margin Drink</h3>
                {highestMarginRecipe ? (
                  <div>
                    <p className="text-2xl font-bold text-[#4A403A] dark:text-[#E6DCC8]">{highestMarginRecipe.drinkName || highestMarginRecipe.name}</p>
                    <div className="flex justify-between mt-4 text-sm text-[#8C7B70]">
                      <span>Margin: <strong className="text-green-600">{highestMarginRecipe.margin.toFixed(1)}%</strong></span>
                      <span>Cost: ₱{highestMarginRecipe.cost.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[#8C7B70] text-sm">No active recipes found.</p>
                )}
              </div>

              <div className="bg-white dark:bg-[#241E1C] p-6 rounded-xl shadow-sm border border-[#E6DCC8] dark:border-[#423630]">
                <h3 className="font-bold text-[#823A1E] dark:text-[#D4A373] mb-4">Lowest Margin Drink</h3>
                {lowestMarginRecipe ? (
                  <div>
                    <p className="text-2xl font-bold text-[#4A403A] dark:text-[#E6DCC8]">{lowestMarginRecipe.drinkName || lowestMarginRecipe.name}</p>
                    <div className="flex justify-between mt-4 text-sm text-[#8C7B70]">
                      <span>Margin: <strong className="text-red-500">{lowestMarginRecipe.margin.toFixed(1)}%</strong></span>
                      <span>Cost: ₱{lowestMarginRecipe.cost.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[#8C7B70] text-sm">No active recipes found.</p>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}