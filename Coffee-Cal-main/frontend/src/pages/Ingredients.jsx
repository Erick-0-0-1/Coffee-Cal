import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Milk, Package, Search, ChevronDown } from 'lucide-react';
import { ingredientService } from '../services/api';

const Ingredients = () => {
  const [ingredients, setIngredients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ FIX 1: Updated state to match backend DTO (baseUnit and packPrice)
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Beans',
    packSize: '',
    baseUnit: 'g', // Changed from packUnit
    packPrice: ''  // Changed from totalPrice
  });

  const categories = ['Beans', 'Milk', 'Syrup', 'Powder', 'Sauce', 'Topping', 'Packaging'];
  const units = [
    { label: 'g (Grams)', value: 'g' },
    { label: 'ml (Milliliters)', value: 'ml' },
    { label: 'pcs (Pieces)', value: 'pcs' },
  ];

  useEffect(() => {
    loadIngredients();
  }, []);

  const loadIngredients = async () => {
    try {
      setError('');
      const data = await ingredientService.getAll();
      setIngredients(data);
    } catch (error) {
      setError(error.message || 'Failed to load ingredients');
      console.error('Failed to load ingredients', error);
    }
  };

  // ✅ FIX 2: Updated calculation to use packPrice
  const calculateUnitCost = (item) => {
    if (!item.packPrice || !item.packSize) return 0;
    return item.packPrice / item.packSize;
  };

  const handleSave = async () => {
    // ✅ FIX 3: Updated validation to check for packPrice
    if (!newItem.name || !newItem.packSize || !newItem.packPrice) return;

    try {
      setLoading(true);
      setError('');
      
      // ✅ FIX 4: The payload now perfectly matches the backend expectations
      const ingredientToSave = {
        ...newItem,
        packSize: parseFloat(newItem.packSize),
        packPrice: parseFloat(newItem.packPrice),
        currentStock: 0 // Default stock
      };

      await ingredientService.create(ingredientToSave);
      setIsModalOpen(false);
      // Reset with correct keys
      setNewItem({ name: '', category: 'Beans', packSize: '', baseUnit: 'g', packPrice: '' });
      loadIngredients();
    } catch (error) {
      setError(error.message || 'Failed to save ingredient');
      console.error('Failed to save ingredient', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this ingredient?")) return;
    try {
      setLoading(true);
      setError('');
      await ingredientService.delete(id);
      loadIngredients();
    } catch (error) {
      setError(error.message || 'Failed to delete ingredient');
      console.error('Failed to delete ingredient', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredIngredients = ingredients.filter(item =>
    (filterCategory === 'All' || item.category === filterCategory) &&
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#1c1917] text-stone-200 pb-24 font-sans">
        <div className="max-w-5xl mx-auto p-4 space-y-6">

          {/* Error Display */}
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-400 rounded-lg p-4 flex items-center justify-between">
              <span>{error}</span>
              <button 
                onClick={() => setError('')}
                className="text-red-400 hover:text-red-300 font-bold px-2"
              >
                ✕
              </button>
            </div>
          )}

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#d4a373]">Inventory</h1>
            <p className="text-stone-400 text-sm">Manage your stock and costs.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary w-full md:w-auto flex items-center justify-center gap-2 py-3 bg-[#9c4221] rounded-xl font-bold shadow-lg"
          >
            <Plus size={20} /> Add Ingredient
          </button>
        </div>

        {/* SEARCH & FILTER */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search ingredients..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-12 pr-4 py-3 focus:border-[#d4a373] outline-none"
            />
          </div>

          {/* Scrollable Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setFilterCategory('All')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${filterCategory === 'All' ? 'bg-[#d4a373] text-[#1c1917] border-[#d4a373]' : 'bg-transparent border-stone-700 text-stone-400'}`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${filterCategory === cat ? 'bg-[#d4a373] text-[#1c1917] border-[#d4a373]' : 'bg-transparent border-stone-700 text-stone-400'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* LIST */}
        <div className="space-y-3">
          {filteredIngredients.map(item => (
            <div key={item.id} className="bg-stone-900/50 border border-stone-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-white">{item.name}</h3>
                  <span className="text-[10px] bg-stone-800 text-stone-400 px-2 py-0.5 rounded border border-stone-700 uppercase tracking-wider">{item.category}</span>
                </div>
                <div className="text-sm text-stone-500 flex gap-4">
                  {/* ✅ FIX 5: Updated rendering to display the backend properties correctly */}
                  <span>₱{item.packPrice} / {item.packSize}{item.baseUnit}</span>
                  <span className="text-[#d4a373] font-mono">Cost: ₱{calculateUnitCost(item).toFixed(4)}/{item.baseUnit}</span>
                </div>
              </div>
              <button onClick={() => handleDelete(item.id)} className="p-2 text-stone-600 hover:text-red-400 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* --- MOBILE OPTIMIZED MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

          {/* Modal Content */}
          <div className="relative bg-[#1c1917] w-full md:max-w-lg md:rounded-2xl rounded-t-2xl shadow-2xl border-t md:border border-stone-800 flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="p-5 border-b border-stone-800 flex justify-between items-center bg-[#292524] md:rounded-t-2xl rounded-t-2xl">
              <h2 className="text-xl font-bold text-[#d4a373]">Add New Item</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-white">✕</button>
            </div>

            {/* Modal Error Display */}
            {error && (
              <div className="mx-5 mt-5 bg-red-900/50 border border-red-700 text-red-400 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            {/* Scrollable Form Area */}
            <div className="p-5 space-y-5 overflow-y-auto">

              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Full Cream Milk"
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-white focus:border-[#d4a373] outline-none"
                  value={newItem.name}
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Category</label>
                <div className="relative">
                  <select
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-white appearance-none focus:border-[#d4a373] outline-none"
                    value={newItem.category}
                    onChange={e => setNewItem({...newItem, category: e.target.value})}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 w-4 h-4 pointer-events-none" />
                </div>
              </div>

              {/* --- FIXED ALIGNMENT ROW --- */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-500 uppercase">Size</label>
                  <input
                    type="number"
                    placeholder="1000"
                    className="w-full h-12 bg-stone-900 border border-stone-700 rounded-lg px-3 text-white focus:border-[#d4a373] outline-none"
                    value={newItem.packSize}
                    onChange={e => setNewItem({...newItem, packSize: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-500 uppercase">Unit</label>
                  <div className="relative h-12">
                    <select
                      className="w-full h-full bg-stone-900 border border-stone-700 rounded-lg pl-3 pr-8 text-white appearance-none focus:border-[#d4a373] outline-none"
                      // ✅ FIX 6: Bound to baseUnit
                      value={newItem.baseUnit}
                      onChange={e => setNewItem({...newItem, baseUnit: e.target.value})}
                    >
                      {units.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 w-4 h-4 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-500 uppercase">Price (₱)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full h-12 bg-stone-900 border border-stone-700 rounded-lg px-3 text-white focus:border-[#d4a373] outline-none"
                    // ✅ FIX 7: Bound to packPrice
                    value={newItem.packPrice}
                    onChange={e => setNewItem({...newItem, packPrice: e.target.value})}
                  />
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-5 border-t border-stone-800 bg-[#1c1917] pb-8 md:pb-5 rounded-b-2xl">
              <button
                onClick={handleSave}
                className="w-full bg-[#9c4221] hover:bg-[#7c3218] text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all"
              >
                Save Item
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Ingredients;