import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Star, Filter as FilterIcon } from 'lucide-react';
import { ProductFilter, SearchFilters } from '../types/product';
import { productService } from '../services/productService';

interface ProductFilterProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ProductFilter;
  searchFilters: SearchFilters;
  onFiltersChange: (filters: ProductFilter) => void;
  onSearchFiltersChange: (filters: SearchFilters) => void;
  resultCount: number;
}

const ProductFilterComponent: React.FC<ProductFilterProps> = ({
  isOpen,
  onClose,
  filters,
  searchFilters,
  onFiltersChange,
  onSearchFiltersChange,
  resultCount
}) => {
  const [filterOptions, setFilterOptions] = useState({
    categories: [] as string[],
    materials: [] as string[],
    craftsmen: [] as string[],
    priceRange: { min: 0, max: 100000 },
    tags: [] as string[]
  });
  
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    materials: false,
    craftsmen: false,
    ratings: false,
    availability: true
  });

  useEffect(() => {
    const options = productService.getFilterOptions();
    setFilterOptions(options);
  }, []);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCategoryChange = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const handleMaterialChange = (material: string) => {
    const newMaterials = filters.materials.includes(material)
      ? filters.materials.filter(m => m !== material)
      : [...filters.materials, material];
    
    onFiltersChange({ ...filters, materials: newMaterials });
  };

  const handleCraftsmanChange = (craftsman: string) => {
    const newCraftsmen = filters.craftsmen.includes(craftsman)
      ? filters.craftsmen.filter(c => c !== craftsman)
      : [...filters.craftsmen, craftsman];
    
    onFiltersChange({ ...filters, craftsmen: newCraftsmen });
  };

  const handleRatingChange = (rating: number) => {
    const newRatings = filters.ratings.includes(rating)
      ? filters.ratings.filter(r => r !== rating)
      : [...filters.ratings, rating];
    
    onFiltersChange({ ...filters, ratings: newRatings });
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    onFiltersChange({ ...filters, priceRange: { min, max } });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      categories: [],
      priceRange: { min: 0, max: 100000 },
      materials: [],
      craftsmen: [],
      ratings: [],
      availability: false,
      isNew: false,
      isFeatured: false,
      tags: []
    });
  };

  const getActiveFilterCount = () => {
    return filters.categories.length + 
           filters.materials.length + 
           filters.craftsmen.length + 
           filters.ratings.length +
           (filters.availability ? 1 : 0) +
           (filters.isNew ? 1 : 0) +
           (filters.isFeatured ? 1 : 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <FilterIcon className="h-5 w-5 text-gray-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              {getActiveFilterCount() > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {getActiveFilterCount()}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Results count and sort */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">{resultCount} products found</span>
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Clear all
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
                <select
                  value={searchFilters.sortBy}
                  onChange={(e) => onSearchFiltersChange({ 
                    ...searchFilters, 
                    sortBy: e.target.value as SearchFilters['sortBy']
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="name">Name A-Z</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest First</option>
                  <option value="featured">Featured First</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">View</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onSearchFiltersChange({ ...searchFilters, viewMode: 'grid' })}
                    className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-colors ${
                      searchFilters.viewMode === 'grid'
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => onSearchFiltersChange({ ...searchFilters, viewMode: 'list' })}
                    className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-colors ${
                      searchFilters.viewMode === 'list'
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    List
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Categories */}
            <div>
              <button
                onClick={() => toggleSection('categories')}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="text-sm font-semibold text-gray-900">Categories</h3>
                {expandedSections.categories ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
              
              {expandedSections.categories && (
                <div className="mt-3 space-y-2">
                  {filterOptions.categories.map(category => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category)}
                        onChange={() => handleCategoryChange(category)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{category}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>          
  {/* Price Range */}
            <div>
              <button
                onClick={() => toggleSection('price')}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="text-sm font-semibold text-gray-900">Price Range</h3>
                {expandedSections.price ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
              
              {expandedSections.price && (
                <div className="mt-3 space-y-3">
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Min</label>
                      <input
                        type="number"
                        value={filters.priceRange.min}
                        onChange={(e) => handlePriceRangeChange(
                          parseInt(e.target.value) || 0,
                          filters.priceRange.max
                        )}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Max</label>
                      <input
                        type="number"
                        value={filters.priceRange.max}
                        onChange={(e) => handlePriceRangeChange(
                          filters.priceRange.min,
                          parseInt(e.target.value) || 100000
                        )}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        placeholder="100000"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    ₹{filters.priceRange.min.toLocaleString()} - ₹{filters.priceRange.max.toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* Materials */}
            <div>
              <button
                onClick={() => toggleSection('materials')}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="text-sm font-semibold text-gray-900">Materials</h3>
                {expandedSections.materials ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
              
              {expandedSections.materials && (
                <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
                  {filterOptions.materials.map(material => (
                    <label key={material} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.materials.includes(material)}
                        onChange={() => handleMaterialChange(material)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{material}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Craftsmen */}
            <div>
              <button
                onClick={() => toggleSection('craftsmen')}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="text-sm font-semibold text-gray-900">Craftsmen</h3>
                {expandedSections.craftsmen ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
              
              {expandedSections.craftsmen && (
                <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
                  {filterOptions.craftsmen.map(craftsman => (
                    <label key={craftsman} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.craftsmen.includes(craftsman)}
                        onChange={() => handleCraftsmanChange(craftsman)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{craftsman}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Ratings */}
            <div>
              <button
                onClick={() => toggleSection('ratings')}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="text-sm font-semibold text-gray-900">Minimum Rating</h3>
                {expandedSections.ratings ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
              
              {expandedSections.ratings && (
                <div className="mt-3 space-y-2">
                  {[4, 3, 2, 1].map(rating => (
                    <label key={rating} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.ratings.includes(rating)}
                        onChange={() => handleRatingChange(rating)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="ml-2 flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-sm text-gray-700">& up</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Availability & Special */}
            <div>
              <button
                onClick={() => toggleSection('availability')}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="text-sm font-semibold text-gray-900">Availability & Special</h3>
                {expandedSections.availability ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
              
              {expandedSections.availability && (
                <div className="mt-3 space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.availability}
                      onChange={(e) => onFiltersChange({ ...filters, availability: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">In Stock Only</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.isNew}
                      onChange={(e) => onFiltersChange({ ...filters, isNew: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">New Products</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.isFeatured}
                      onChange={(e) => onFiltersChange({ ...filters, isFeatured: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Featured Products</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFilterComponent;