
import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { productsData, Product } from '../data/products';

const Furniture = () => {
  const [products] = useState<Product[]>(productsData.filter((p: Product) => p.metadata.category.toLowerCase() === 'furniture'));
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('name');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [specialFilters, setSpecialFilters] = useState({ isNew: false, isFeatured: false });

  const sortOptions = [
    { value: 'name', label: 'Name A-Z' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest First' }
  ];

  useEffect(() => {
    let filtered = products;

    // Search
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.metadata.craftsman.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Price Range
    filtered = filtered.filter(product =>
      product.pricing.basePrice >= priceRange.min && product.pricing.basePrice <= priceRange.max
    );

    // Special Filters
    if (specialFilters.isNew) {
      filtered = filtered.filter(product => product.isNew);
    }
    if (specialFilters.isFeatured) {
      filtered = filtered.filter(product => product.isFeatured);
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered = [...filtered].sort((a, b) => a.pricing.basePrice - b.pricing.basePrice);
        break;
      case 'price-high':
        filtered = [...filtered].sort((a, b) => b.pricing.basePrice - a.pricing.basePrice);
        break;
      case 'newest':
        filtered = [...filtered].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      default:
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, priceRange, sortBy, specialFilters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleSpecialFilter = (key: keyof typeof specialFilters) => {
    setSpecialFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPriceRange({ min: 0, max: 100000 });
    setSpecialFilters({ isNew: false, isFeatured: false });
    setSortBy('name');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-4">Furniture Collection</h1>
          <p className="text-xl text-gray-600">Discover authentic Jodhpur furniture crafted by master artisans</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search furniture, artisans..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {/* Search Icon */}
                <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              </div>
            </form>

            {/* View Mode and Sort */}
            <div className="flex items-center gap-4">
              <div className="flex bg-gray-100 rounded-full p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-full transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="4" cy="6" r="2" /><circle cx="4" cy="12" r="2" /><circle cx="4" cy="18" r="2" /></svg>
                </button>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="8" /></svg>
                Filters
                <svg className={`h-4 w-4 ml-2 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
            </div>
          </div>

          {/* Expandable Filters */}
          {isFilterOpen && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Price Range */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Price Range</label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="100000"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>₹0</span>
                      <span>₹{priceRange.max.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                {/* Special Filters */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Special</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" checked={specialFilters.isNew} onChange={() => handleSpecialFilter('isNew')} className="text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-gray-700">New Arrivals</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" checked={specialFilters.isFeatured} onChange={() => handleSpecialFilter('isFeatured')} className="text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-gray-700">Featured</span>
                    </label>
                  </div>
                </div>
                {/* Clear Filters */}
                <div className="flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </div>

        {/* Products Grid/List */}
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'
            : 'space-y-6'
        }>
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} viewMode={viewMode} />
          ))}
        </div>

        {/* No Results */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🪑</div>
            <h3 className="text-2xl font-bold text-blue-900 mb-2">No furniture found</h3>
            <p className="text-gray-600 mb-6">Check back soon for more beautiful pieces.</p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Furniture;
