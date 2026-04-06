import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, ProtectedRoute } from './context/AuthContext';
import Navbar from './components/Navbar';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import CoffeeCosting from './pages/CoffeeCosting';
import Recipes from './pages/Recipes';
import RecipeDetail from './pages/RecipeDetail';
import Ingredients from './pages/Ingredients';
import Statistics from './pages/Statistics';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <div className="min-h-screen transition-colors duration-200">
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <main className="container mx-auto px-4 py-4 md:py-8 max-w-7xl">
                       <Routes>
                         <Route path="/dashboard" element={<Dashboard />} />
                         <Route path="/costing" element={<CoffeeCosting />} />
                         <Route path="/recipes" element={<Recipes />} />
                         <Route path="/recipes/:id" element={<RecipeDetail />} />
                         <Route path="/ingredients" element={<Ingredients />} />
                         <Route path="/statistics" element={<Statistics />} />
                         <Route path="/" element={<Navigate to="/dashboard" replace />} />
                       </Routes>
                    </main>
                  </>
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}


export default App;