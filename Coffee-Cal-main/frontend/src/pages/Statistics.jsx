import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Banknote, Package } from 'lucide-react';
import { recipeService, ingredientService } from '../services/api';

const Statistics = ({ refreshTrigger }) => {
  const [stats, setStats] = useState(null);
  const [ingredientCount, setIngredientCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, [refreshTrigger]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const [statsData, ingredientsData] = await Promise.all([
        recipeService.getStatistics(),
        ingredientService.getAll(),
      ]);
      setStats(statsData);
      setIngredientCount(ingredientsData.length);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <BarChart3 className="w-16 h-16 text-coffee-600 dark:text-coffee-400 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-coffee-900 dark:text-cream-50 mb-2">Business Analytics</h1>
        <p className="text-coffee-600 dark:text-coffee-300">Overview of your coffee business performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={BarChart3}
          label="Total Recipes"
          value={stats?.totalRecipes || 0}
          color="from-coffee-500 to-coffee-600"
        />
        <MetricCard
          icon={Package}
          label="Total Ingredients"
          value={ingredientCount}
          color="from-matcha-500 to-matcha-600"
        />
        <MetricCard
          icon={Banknote}
          label="Avg Selling Price"
          value={`₱${stats?.averageSellingPrice?.toFixed(2) || '0.00'}`}
          color="from-caramel-500 to-caramel-600"
        />
        <MetricCard
          icon={TrendingUp}
          label="Avg Profit Margin"
          value={`${stats?.averageMargin?.toFixed(1) || '0.0'}%`}
          color="from-coffee-700 to-coffee-800"
        />
      </div>

      {/* Complexity Breakdown */}
      {stats && (
        <div className="card dark:bg-coffee-800 dark:border-coffee-700">
          <h2 className="text-2xl font-bold text-coffee-900 dark:text-cream-50 mb-6">Recipe Complexity Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ComplexityBar
              label="Simple"
              count={stats.simpleRecipes}
              total={stats.totalRecipes}
              color="bg-matcha-500"
            />
            <ComplexityBar
              label="Moderate"
              count={stats.moderateRecipes}
              total={stats.totalRecipes}
              color="bg-caramel-500"
            />
            <ComplexityBar
              label="Complex"
              count={stats.complexRecipes}
              total={stats.totalRecipes}
              color="bg-coffee-500"
            />
            <ComplexityBar
              label="Very Complex"
              count={stats.veryComplexRecipes}
              total={stats.totalRecipes}
              color="bg-red-900"
            />
          </div>
        </div>
      )}

      {/* Cost Analysis */}
      <div className="card dark:bg-coffee-800 dark:border-coffee-700">
        <h2 className="text-2xl font-bold text-coffee-900 dark:text-cream-50 mb-6">Cost Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-coffee-900 dark:to-coffee-950 rounded-xl p-6 border-2 border-blue-200 dark:border-coffee-700">
            <p className="text-sm font-medium text-blue-700 dark:text-coffee-400 mb-2">Average Cost per Recipe</p>
            <p className="text-3xl font-bold text-blue-900 dark:text-cream-100">
              ₱{stats?.averageCost?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-matcha-600/20 dark:to-matcha-600/10 rounded-xl p-6 border-2 border-green-200 dark:border-matcha-500/50">
            <p className="text-sm font-medium text-green-700 dark:text-matcha-400 mb-2">Average Selling Price</p>
            <p className="text-3xl font-bold text-green-900 dark:text-matcha-500">
              ₱{stats?.averageSellingPrice?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-caramel-600/20 dark:to-caramel-600/10 rounded-xl p-6 border-2 border-purple-200 dark:border-caramel-500/50">
            <p className="text-sm font-medium text-purple-700 dark:text-caramel-400 mb-2">Average Profit per Sale</p>
            <p className="text-3xl font-bold text-purple-900 dark:text-caramel-500">
              ₱{((stats?.averageSellingPrice || 0) - (stats?.averageCost || 0)).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="card bg-gradient-to-br from-coffee-50 to-cream-50 dark:from-coffee-800 dark:to-coffee-900 dark:border-coffee-700">
        <h2 className="text-2xl font-bold text-coffee-900 dark:text-cream-50 mb-4">Business Insights</h2>
        <div className="space-y-3">
          <InsightRow
            label="Portfolio Size"
            value={`${stats?.totalRecipes || 0} active recipes`}
            isGood={stats?.totalRecipes > 5}
          />
          <InsightRow
            label="Average Margin"
            value={`${stats?.averageMargin?.toFixed(1) || '0.0'}%`}
            isGood={stats?.averageMargin >= 40}
          />
          <InsightRow
            label="Ingredient Library"
            value={`${ingredientCount} ingredients tracked`}
            isGood={ingredientCount > 10}
          />
          <InsightRow
            label="Recipe Diversity"
            value={`${((stats?.complexRecipes + stats?.veryComplexRecipes) / (stats?.totalRecipes || 1) * 100 || 0).toFixed(0)}% complex recipes`}
            isGood={stats?.complexRecipes + stats?.veryComplexRecipes > 0}
          />
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon: Icon, label, value, color }) => (
  <div className="stats-card animate-scale-in dark:bg-coffee-800 dark:border dark:border-coffee-700">
    <div className={`bg-gradient-to-br ${color} p-3 rounded-xl mb-4 w-fit`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <p className="text-sm font-medium text-coffee-600 dark:text-coffee-300 mb-1">{label}</p>
    <p className="text-3xl font-bold text-coffee-900 dark:text-cream-50">{value}</p>
  </div>
);

const ComplexityBar = ({ label, count, total, color }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-coffee-800 dark:text-cream-100">{label}</span>
        <span className="text-coffee-600 dark:text-coffee-300">{count}</span>
      </div>
      <div className="h-3 bg-coffee-100 dark:bg-coffee-900 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-coffee-600 dark:text-coffee-400 text-right">{percentage.toFixed(0)}%</p>
    </div>
  );
};

const InsightRow = ({ label, value, isGood }) => (
  <div className="flex items-center justify-between p-3 bg-white dark:bg-coffee-950 rounded-lg dark:border dark:border-coffee-800">
    <span className="font-medium text-coffee-800 dark:text-cream-100">{label}</span>
    <div className="flex items-center space-x-2">
      <span className="text-coffee-900 dark:text-cream-50">{value}</span>
      <div
        className={`w-3 h-3 rounded-full ${
          isGood ? 'bg-matcha-500' : 'bg-caramel-500'
        }`}
      />
    </div>
  </div>
);

export default Statistics;