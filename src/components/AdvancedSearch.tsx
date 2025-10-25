import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Filter, Clock, TrendingUp } from 'lucide-react';
import { productService } from '../services/productService';
import { SearchSuggestion, SearchHistory } from '../types/product';

interface AdvancedSearchProps {
  onSearch: (query: string) => void;
  onFilterToggle: () => void;
  searchTerm: string;
  placeholder?: string;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  onFilterToggle,
  searchTerm,
  placeholder = "Search products, categories, materials..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load search history
  useEffect(() => {
    setSearchHistory(productService.getSearchHistory());
  }, []);

  // Generate suggestions based on search term
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }

    const newSuggestions = productService.getSearchSuggestions(searchTerm);
    setSuggestions(newSuggestions);
  }, [searchTerm]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = suggestions.length + searchHistory.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : -1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > -1 ? prev - 1 : totalItems - 1));
        break;     
 case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (selectedIndex < suggestions.length) {
            handleSuggestionClick(suggestions[selectedIndex]);
          } else {
            const historyIndex = selectedIndex - suggestions.length;
            handleHistoryClick(searchHistory[historyIndex]);
          }
        } else if (searchTerm.trim()) {
          handleSearch(searchTerm);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSearch = (query: string) => {
    onSearch(query);
    setIsOpen(false);
    setSelectedIndex(-1);
    setSearchHistory(productService.getSearchHistory());
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    handleSearch(suggestion.value);
  };

  const handleHistoryClick = (historyItem: SearchHistory) => {
    handleSearch(historyItem.query);
  };

  const clearHistory = () => {
    productService.clearSearchHistory();
    setSearchHistory([]);
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'product':
        return <Search className="h-4 w-4" />;
      case 'category':
        return <Filter className="h-4 w-4" />;
      case 'material':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center">
          {searchTerm && (
            <button
              onClick={() => onSearch('')}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={onFilterToggle}
            className="p-2 mr-2 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (suggestions.length > 0 || searchHistory.length > 0) && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-96 overflow-y-auto">
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={`suggestion-${index}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors ${
                    selectedIndex === index ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <div className="text-gray-400 mr-3">
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{suggestion.label}</div>
                    {suggestion.count && (
                      <div className="text-xs text-gray-500">{suggestion.count} products</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <div className="flex items-center justify-between px-3 py-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Recent Searches
                </div>
                <button
                  onClick={clearHistory}
                  className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Clear
                </button>
              </div>
              {searchHistory.slice(0, 5).map((historyItem, index) => (
                <button
                  key={`history-${index}`}
                  onClick={() => handleHistoryClick(historyItem)}
                  className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors ${
                    selectedIndex === suggestions.length + index ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <Clock className="h-4 w-4 text-gray-400 mr-3" />
                  <div className="flex-1">
                    <div className="text-sm">{historyItem.query}</div>
                    <div className="text-xs text-gray-500">
                      {historyItem.resultsCount} results
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;