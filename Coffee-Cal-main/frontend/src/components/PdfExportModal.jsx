import { useState } from 'react';
import { X, FileText, Download } from 'lucide-react';
import api from '../services/api';

const PdfExportModal = ({ isOpen, onClose, recipeId, recipeName }) => {
  const [sections, setSections] = useState({
    ingredients: true,
    costBreakdown: true,
    profitAnalysis: true,
    notes: true
  });
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(''); // Added error state

  if (!isOpen) return null;

  const handleSectionToggle = (section) => {
    setSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleExport = async () => {
    setExporting(true);
    setError(''); // Clear any previous errors when trying again
    
    try {
      const response = await api.post(`/api/recipes/${recipeId}/export-pdf`, 
        { recipeId, sections },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${recipeName.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      onClose(); // Close modal on success
    } catch (err) {
      console.error('PDF export failed:', err);
      
      // Axios returns blob errors weirdly, so we handle it to show a readable message
      if (err.response && err.response.data instanceof Blob) {
         setError("Server error: Unable to generate the PDF right now.");
      } else {
         setError(err.message || 'Failed to generate PDF. Please try again.');
      }
    } finally {
      setExporting(false); // Make sure the spinner stops even if it fails
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Export Recipe PDF</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Select which sections to include in the PDF:</p>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <input
                type="checkbox"
                checked={sections.ingredients}
                onChange={() => handleSectionToggle('ingredients')}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Ingredients</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">List of ingredients with quantities and costs</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <input
                type="checkbox"
                checked={sections.costBreakdown}
                onChange={() => handleSectionToggle('costBreakdown')}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Cost Breakdown</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total cost, overhead, target margin</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <input
                type="checkbox"
                checked={sections.profitAnalysis}
                onChange={() => handleSectionToggle('profitAnalysis')}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Profit Analysis</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Gross/net profit and margin percentages</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <input
                type="checkbox"
                checked={sections.notes}
                onChange={() => handleSectionToggle('notes')}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Notes</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Additional recipe notes and instructions</div>
              </div>
            </label>
          </div>
        </div>

        {/* Added Error Display UI */}
        {error && (
          <div className="px-6 pb-2">
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg text-center font-medium">
              {error}
            </div>
          </div>
        )}

        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || !Object.values(sections).some(v => v)}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full w-5 h-5 border-2 border-white border-t-transparent" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Export PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfExportModal;