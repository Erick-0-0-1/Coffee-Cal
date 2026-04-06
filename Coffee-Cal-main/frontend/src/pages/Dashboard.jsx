import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Coffee, Package, BookOpen, TrendingUp, DollarSign, Percent } from 'lucide-react';
import { recipeService, ingredientService } from '../services/api';

const Dashboard = ({ refreshTrigger }) => {
  const [stats, setStats] = useState(null);
  const [ingredientCount, setIngredientCount] = useState(0);
  const [recentRecipes, setRecentRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [refreshTrigger]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, ingredientsData, recipesData] = await Promise.all([
        recipeService.getStatistics(),
        ingredientService.getAll(),
        recipeService.getAll(),
      ]);

      setStats(statsData);
      setIngredientCount(ingredientsData.length);
      setRecentRecipes(recipesData.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Coffee className="w-16 h-16 text-coffee-600 animate-pulse mx-auto mb-4" />
          <p className="text-coffee-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-coffee-900 tracking-tight">
          Welcome to CaféCalc
        </h1>
        <p className="text-xl text-coffee-600 max-w-2xl mx-auto">
          Your complete solution for coffee recipe costing and pricing optimization
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={BookOpen}
          label="Total Recipes"
          value={stats?.totalRecipes || 0}
          color="from-blue-500 to-blue-600"
          delay="animate-delay-100"
        />
        <StatsCard
          icon={Package}
          label="Ingredients"
          value={ingredientCount}
          color="from-green-500 to-green-600"
          delay="animate-delay-200"
        />
        <StatsCard
          icon={DollarSign}
          label="Avg. Selling Price"
          value={`${stats?.averageSellingPrice?.toFixed(2) || '0.00'}`}
          color="from-purple-500 to-purple-600"
          delay="animate-delay-300"
        />
        <StatsCard
          icon={Percent}
          label="Avg. Margin"
          value={`${stats?.averageMargin?.toFixed(1) || '0.0'}%`}
          color="from-orange-500 to-orange-600"
        />
      </div>

      {/* Recipe Complexity Breakdown */}
      {stats && (
        <div className="card animate-slide-up">
          <h2 className="text-2xl font-bold text-coffee-900 mb-6 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-coffee-600" />
            Recipe Complexity Breakdown
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ComplexityCard label="Simple" count={stats.simpleRecipes} color="bg-green-100 text-green-800" />
            <ComplexityCard label="Moderate" count={stats.moderateRecipes} color="bg-blue-100 text-blue-800" />
            <ComplexityCard label="Complex" count={stats.complexRecipes} color="bg-orange-100 text-orange-800" />
            <ComplexityCard label="Very Complex" count={stats.veryComplexRecipes} color="bg-red-100 text-red-800" />
          </div>
        </div>
      )}

      {/* Recent Recipes */}
      <div className="card animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-coffee-900 flex items-center">
            <Coffee className="w-6 h-6 mr-2 text-coffee-600" />
            Recent Recipes
          </h2>
          <Link to="/recipes" className="text-coffee-600 hover:text-coffee-800 font-medium">
            View All →
          </Link>
        </div>
        {recentRecipes.length > 0 ? (
          <div className="space-y-3">
            {recentRecipes.map((recipe) => (
              <Link
                key={recipe.id}
                to={`/recipes/${recipe.id}`}
                className="block p-4 rounded-lg border-2 border-coffee-100 hover:border-coffee-300 hover:bg-coffee-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-coffee-900">{recipe.drinkName}</h3>
                    <p className="text-sm text-coffee-600">
                      {recipe.ingredients.length} ingredients • {recipe.complexityLevel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-coffee-900">
                      ₱{recipe.suggestedSellingPrice?.toFixed(2)}
                    </p>
                    <p className="text-sm text-green-600 font-medium">
                      {recipe.actualMarginPercent?.toFixed(1)}% margin
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Coffee className="w-16 h-16 text-coffee-300 mx-auto mb-4" />
            <p className="text-coffee-600">No recipes yet. Create your first recipe!</p>
            <Link to="/recipes" className="btn-primary inline-block mt-4">
              Create Recipe
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/ingredients" className="card hover:shadow-2xl transition-all group">
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-4 rounded-xl group-hover:scale-110 transition-transform">
              <Package className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-coffee-900">Manage Supplies</h3>
              <p className="text-coffee-600">Add and update ingredient prices</p>
            </div>
          </div>
        </Link>
        <Link to="/recipes" className="card hover:shadow-2xl transition-all group">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-4 rounded-xl group-hover:scale-110 transition-transform">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-coffee-900">Create Recipes</h3>
              <p className="text-coffee-600">Build and cost your drinks</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};



const StatsCard = ({ icon: Icon, label, value, color, delay = '' }) => (
  <div className={`stats-card animate-scale-in ${delay}`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`bg-gradient-to-br ${color} p-3 rounded-xl`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <p className="text-sm font-medium text-coffee-600 mb-1">{label}</p>
    <p className="text-3xl font-bold text-coffee-900">{value}</p>
  </div>
);

const ComplexityCard = ({ label, count, color }) => (
  <div className={`${color} p-4 rounded-lg text-center`}>
    <p className="text-2xl font-bold mb-1">{count}</p>
    <p className="text-sm font-medium">{label}</p>
  </div>
);

export default Dashboard;