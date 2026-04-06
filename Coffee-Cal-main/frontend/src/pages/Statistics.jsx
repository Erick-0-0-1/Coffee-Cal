import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Package } from 'lucide-react';
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
        <BarChart3 className="w-16 h-16 text-coffee-600 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-coffee-900 mb-2">Business Analytics</h1>
        <p className="text-coffee-600">Overview of your coffee business performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={BarChart3}
          label="Total Recipes"
          value={stats?.totalRecipes || 0}
          color="from-blue-500 to-blue-600"
        />
        <MetricCard
          icon={Package}
          label="Total Ingredients"
          value={ingredientCount}
          color="from-green-500 to-green-600"
        />
        <MetricCard
          icon={DollarSign}
          label="Avg Selling Price"
          value={`${stats?.averageSellingPrice?.toFixed(2) || '0.00'}`}
          color="from-purple-500 to-purple-600"
        />
        <MetricCard
          icon={TrendingUp}
          label="Avg Profit Margin"
          value={`${stats?.averageMargin?.toFixed(1) || '0.0'}%`}
          color="from-orange-500 to-orange-600"
        />
      </div>

      {/* Complexity Breakdown */}
      {stats && (
        <div className="card">
          <h2 className="text-2xl font-bold text-coffee-900 mb-6">Recipe Complexity Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ComplexityBar
              label="Simple"
              count={stats.simpleRecipes}
              total={stats.totalRecipes}
              color="bg-green-500"
            />
            <ComplexityBar
              label="Moderate"
              count={stats.moderateRecipes}
              total={stats.totalRecipes}
              color="bg-blue-500"
            />
            <ComplexityBar
              label="Complex"
              count={stats.complexRecipes}
              total={stats.totalRecipes}
              color="bg-orange-500"
            />
            <ComplexityBar
              label="Very Complex"
              count={stats.veryComplexRecipes}
              total={stats.totalRecipes}
              color="bg-red-500"
            />
          </div>
        </div>
      )}

      {/* Cost Analysis */}
      <div className="card">
        <h2 className="text-2xl font-bold text-coffee-900 mb-6">Cost Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
            <p className="text-sm font-medium text-blue-700 mb-2">Average Cost per Recipe</p>
            <p className="text-3xl font-bold text-blue-900">
              ${stats?.averageCost?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
            <p className="text-sm font-medium text-green-700 mb-2">Average Selling Price</p>
            <p className="text-3xl font-bold text-green-900">
              ${stats?.averageSellingPrice?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
            <p className="text-sm font-medium text-purple-700 mb-2">Average Profit per Sale</p>
            <p className="text-3xl font-bold text-purple-900">
              $
              {(
                (stats?.averageSellingPrice || 0) - (stats?.averageCost || 0)
              ).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="card bg-gradient-to-br from-coffee-50 to-cream-50">
        <h2 className="text-2xl font-bold text-coffee-900 mb-4">Business Insights</h2>
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
            value={`${((stats?.complexRecipes + stats?.veryComplexRecipes) / stats?.totalRecipes * 100 || 0).toFixed(0)}% complex recipes`}
            isGood={stats?.complexRecipes + stats?.veryComplexRecipes > 0}
          />
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon: Icon, label, value, color }) => (
  <div className="stats-card animate-scale-in">
    <div className={`bg-gradient-to-br ${color} p-3 rounded-xl mb-4 w-fit`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <p className="text-sm font-medium text-coffee-600 mb-1">{label}</p>
    <p className="text-3xl font-bold text-coffee-900">{value}</p>
  </div>
);

const ComplexityBar = ({ label, count, total, color }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-coffee-800">{label}</span>
        <span className="text-coffee-600">{count}</span>
      </div>
      <div className="h-3 bg-coffee-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-coffee-600 text-right">{percentage.toFixed(0)}%</p>
    </div>
  );
};

const InsightRow = ({ label, value, isGood }) => (
  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
    <span className="font-medium text-coffee-800">{label}</span>
    <div className="flex items-center space-x-2">
      <span className="text-coffee-900">{value}</span>
      <div
        className={`w-3 h-3 rounded-full ${
          isGood ? 'bg-green-500' : 'bg-orange-500'
        }`}
      />
    </div>
  </div>
);

export default Statistics;