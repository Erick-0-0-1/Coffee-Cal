import { useState, useEffect } from 'react';
import { Wallet, Save, TrendingUp, Building2, Calculator } from 'lucide-react';
import api from '../services/api';

export default function BusinessAnalysis() {
  // --- STATE ---
  const [monthlySales, setMonthlySales] = useState(1000);
  const [expenses, setExpenses] = useState({
    rent: 15000, electricity: 5000, water: 1000, salaries: 12000, internet: 1500, marketing: 2000, misc: 1000
  });
  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);

  // --- LIFECYCLE ---
  useEffect(() => {
    fetchData();
    loadExpenses();
  }, []);

  const fetchData = async () => {
    try {
      const [recipesRes, ingredientsRes] = await Promise.all([
        api.get('/recipes'),
        api.get('/ingredients')
      ]);
      setRecipes(recipesRes.data || []);
      setIngredients(ingredientsRes.data || []);
    } catch (error) {
      console.error('Error fetching data for analysis:', error);
    }
  };

  const loadExpenses = () => {
    const saved = localStorage.getItem('businessData');
    if (saved) {
      const parsed = JSON.parse(saved);
      setExpenses(parsed.expenses || expenses);
      setMonthlySales(parsed.monthlySales || 1000);
    }
  };

  const saveBusinessData = () => {
    localStorage.setItem('businessData', JSON.stringify({ expenses, monthlySales }));
    alert("Business settings saved!");
  };

  const updateExpense = (field, value) => {
    setExpenses(prev => ({ ...prev, [field]: value }));
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

  const calculateBusinessMetrics = () => {
    let totalRecipeCosts = 0;
    let totalSellingPrices = 0;

    recipes.forEach(r => {
      const cost = calculateRecipeCost(r.ingredients || []);
      let price = parseFloat(r.sellingPrice) || 0;
      totalRecipeCosts += cost;
      totalSellingPrices += price;
    });

    const avgCostPerCup = recipes.length > 0 ? totalRecipeCosts / recipes.length : 0;
    const avgPricePerCup = recipes.length > 0 ? totalSellingPrices / recipes.length : 0;
    const avgProfitPerCup = avgPricePerCup - avgCostPerCup;
    const totalFixedExpenses = Object.values(expenses).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

    const grossRevenue = avgPricePerCup * monthlySales;
    const totalCOGS = avgCostPerCup * monthlySales;
    const grossProfit = grossRevenue - totalCOGS;
    const netProfit = grossProfit - totalFixedExpenses;
    const breakEvenCups = avgProfitPerCup > 0 ? Math.ceil(totalFixedExpenses / avgProfitPerCup) : 0;

    return { avgCostPerCup, avgPricePerCup, avgProfitPerCup, totalFixedExpenses, grossRevenue, totalCOGS, grossProfit, netProfit, breakEvenCups };
  };

  const metrics = calculateBusinessMetrics();

  // --- UI RENDER ---
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in font-sans">
      
      {/* Column 1: Sales Projections */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-[#241E1C] p-6 rounded-xl shadow-sm border border-[#E6DCC8] dark:border-[#423630]">
          <div className="flex items-center gap-2 mb-4 text-[#823A1E] dark:text-[#D4A373]">
            <TrendingUp className="w-5 h-5" />
            <h2 className="text-xl font-bold">Sales Projections</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#8C7B70] mb-1">Estimated Cups Sold / Month</label>
            <input 
              type="number" 
              value={monthlySales} 
              onChange={(e) => setMonthlySales(e.target.value)}
              className="w-full p-3 bg-[#FAF8F4] dark:bg-[#2C2420] border border-[#E6DCC8] dark:border-[#423630] rounded-lg dark:text-[#E6DCC8] focus:ring-2 focus:ring-[#823A1E] outline-none"
            />
          </div>
        </div>

        <button 
          onClick={saveBusinessData} 
          className="w-full bg-[#823A1E] hover:bg-[#682D16] text-white py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2"
        >
          <Save className="w-5 h-5" /> Save Business Settings
        </button>
      </div>

      {/* Column 2: Fixed Expenses */}
      <div className="bg-white dark:bg-[#241E1C] p-6 rounded-xl shadow-sm border border-[#E6DCC8] dark:border-[#423630]">
        <div className="flex items-center gap-2 mb-4 text-[#823A1E] dark:text-[#D4A373]">
          <Building2 className="w-5 h-5" />
          <h2 className="text-xl font-bold">Fixed Monthly Expenses (₱)</h2>
        </div>
        <div className="space-y-3">
          {Object.entries({
            rent: 'Rent', electricity: 'Electricity', water: 'Water', 
            salaries: 'Salaries', internet: 'Internet', marketing: 'Marketing', misc: 'Miscellaneous'
          }).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <label className="text-sm font-medium text-[#8C7B70] w-1/3">{label}</label>
              <input 
                type="number" 
                value={expenses[key]} 
                onChange={(e) => updateExpense(key, e.target.value)}
                className="flex-1 p-2 bg-[#FAF8F4] dark:bg-[#2C2420] border border-[#E6DCC8] dark:border-[#423630] rounded-lg dark:text-[#E6DCC8] text-right focus:ring-2 focus:ring-[#823A1E] outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Column 3: Profitability Summary */}
      <div className="bg-[#FAF8F4] dark:bg-[#2C2420] p-6 rounded-xl border border-[#E6DCC8] dark:border-[#423630] flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-6 text-[#823A1E] dark:text-[#D4A373]">
            <Wallet className="w-5 h-5" />
            <h2 className="text-xl font-bold">Profitability Summary</h2>
          </div>
          
          <div className="space-y-4">
            <SummaryRow label="Gross Revenue" value={metrics.grossRevenue} />
            <SummaryRow label="Total COGS (Ingredients)" value={metrics.totalCOGS} isNegative />
            <div className="h-px bg-[#E6DCC8] dark:bg-[#423630] my-2"></div>
            
            <SummaryRow label="Gross Profit" value={metrics.grossProfit} />
            <SummaryRow label="Total Fixed Expenses" value={metrics.totalFixedExpenses} isNegative />
            <div className="h-px bg-[#E6DCC8] dark:bg-[#423630] my-2"></div>
            
            <div className="flex justify-between items-center text-xl font-bold">
              <span className="text-[#4A403A] dark:text-[#E6DCC8]">Net Profit</span>
              <span className={metrics.netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                ₱{metrics.netProfit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/50 rounded-lg text-center">
          <Calculator className="w-6 h-6 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-orange-800 dark:text-orange-300">Break-even Point</p>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{metrics.breakEvenCups}</p>
          <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">cups per month</p>
        </div>
      </div>

    </div>
  );
}

const SummaryRow = ({ label, value, isNegative }) => (
  <div className="flex justify-between text-sm">
    <span className="text-[#8C7B70]">{label}</span>
    <span className={`font-mono font-medium ${isNegative ? 'text-red-500' : 'text-[#4A403A] dark:text-[#E6DCC8]'}`}>
      {isNegative ? '-' : ''}₱{Math.abs(value || 0).toFixed(2)}
    </span>
  </div>
);