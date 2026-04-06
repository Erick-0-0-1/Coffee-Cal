import { useState } from 'react';
import { Moon, Sun, Coffee, LogOut, User, Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/costing', label: 'Costing' },
    { path: '/recipes', label: 'Recipes' },
    { path: '/ingredients', label: 'Ingredients' },
    { path: '/statistics', label: 'Statistics' },
  ];

  return (
    <nav className="bg-white dark:bg-[#242424] border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 transition-colors">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2.5 rounded-xl">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                coffeeCalc
              </h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'text-blue-600'
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-2">
            <div className="hidden md:flex items-center space-x-2 text-gray-600 dark:text-gray-300">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">{user?.username}</span>
            </div>
            
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-700" />}
            </button>
            
            <button
              onClick={logout}
              className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5 text-red-600" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-gray-100 dark:border-gray-800">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={`block py-3 px-4 rounded-xl text-base font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center py-3 px-4 text-gray-600 dark:text-gray-300">
              <User className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">{user?.username}</span>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;