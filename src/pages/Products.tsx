import React, { useState, useEffect } from 'react';
import { Grid, List, GitCompare, Heart } from 'lucide-react';
import { Product, ProductFilter, SearchFilters, WishlistItem } from '../types/product';
import { productService } from '../services/productService';
import AdvancedSearch from '../components/AdvancedSearch';
import ProductFilterComponent from '../components/ProductFilter';
import ProductCard from '../components/ProductCard';
import ProductComparisonComponent from '../components/ProductComparison';
import Wishlist from '../components/Wishlist';

const Products: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  
  const [filters, setFilters] = useState<ProductFilter>({
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

  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    sortBy: 'name',
    viewMode: 'grid',
    itemsPerPage: 12
  });

  const [comparisonProducts, setComparisonProducts] = useState<Product[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Load products and wishlist
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productService.getProducts();
        if (response && response.products) {
          setFilteredProducts(response.products);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      setWishlistItems(JSON.parse(savedWishlist));
    }
  }, []);

  // Apply search and filters
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      try {
        const response = await productService.getProducts({
          search: searchTerm,
          category: filters.categories.length > 0 ? filters.categories.join(',') : undefined,
          minPrice: filters.priceRange.min,
          maxPrice: filters.priceRange.max,
          inStock: filters.availability ? true : undefined,
          isFeatured: filters.isFeatured ? true : undefined,
          isNew: filters.isNew ? true : undefined,
          minRating: filters.ratings.length > 0 ? Math.min(...filters.ratings) : undefined,
          sortBy: searchFilters.sortBy,
          page: currentPage,
          limit: searchFilters.itemsPerPage
        });
        
        if (response && response.products) {
          setFilteredProducts(response.products);
        }
      } catch (error) {
        console.error('Error fetching filtered products:', error);
      }
    };

    fetchFilteredProducts();
  }, [searchTerm, filters, searchFilters, currentPage]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / searchFilters.itemsPerPage);
  const startIndex = (currentPage - 1) * searchFilters.itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + searchFilters.itemsPerPage);

  const handleSearch = (query: string) => {
    setSearchTerm(query);
  };

  const handleFilterToggle = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const handleAddToComparison = (product: Product) => {
    if (comparisonProducts.length < 3 && !comparisonProducts.find(p => p.id === product.id)) {
      setComparisonProducts([...comparisonProducts, product]);
    }
  };

  const handleRemoveFromComparison = (productId: string) => {
    setComparisonProducts(comparisonProducts.filter(p => p.id !== productId));
  };

  const handleAddToWishlist = (productId: string) => {
    const newItem: WishlistItem = {
      id: `wishlist-${Date.now()}`,
      productId,
      userId: 'current-user', // This would come from auth context
      addedAt: new Date().toISOString()
    };
    
    const updatedWishlist = [...wishlistItems, newItem];
    setWishlistItems(updatedWishlist);
    localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
  };

  const handleRemoveFromWishlist = (productId: string) => {
    const updatedWishlist = wishlistItems.filter(item => item.productId !== productId);
    setWishlistItems(updatedWishlist);
    localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
  };

  const isInWishlist = (productId: string): boolean => {
    return wishlistItems.some(item => item.productId === productId);
  };

  const isInComparison = (productId: string): boolean => {
    return comparisonProducts.some(p => p.id === productId);
  };

  if (showWishlist) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <button
              onClick={() => setShowWishlist(false)}
              className="text-blue-600 hover:text-blue-800 transition-colors mb-4"
            >
              ← Back to Products
            </button>
          </div>
          
          <Wishlist
            wishlistItems={wishlistItems}
            products={filteredProducts}
            onRemoveFromWishlist={handleRemoveFromWishlist}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Products</h1>
          
          {/* Search Bar */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1">
              <AdvancedSearch
                searchTerm={searchTerm}
                onSearch={handleSearch}
                onFilterToggle={handleFilterToggle}
              />
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
              </span>
              
              {searchTerm && (
                <span className="text-sm text-gray-600">
                  for "{searchTerm}"
                </span>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {/* Wishlist Button */}
              <button
                onClick={() => setShowWishlist(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Heart className="h-4 w-4" />
                <span className="text-sm">Wishlist ({wishlistItems.length})</span>
              </button>

              {/* Comparison Button */}
              <button
                onClick={() => setIsComparisonOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={comparisonProducts.length === 0}
              >
                <GitCompare className="h-4 w-4" />
                <span className="text-sm">Compare ({comparisonProducts.length})</span>
              </button>

              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setSearchFilters({ ...searchFilters, viewMode: 'grid' })}
                  className={`p-2 ${
                    searchFilters.viewMode === 'grid'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSearchFilters({ ...searchFilters, viewMode: 'list' })}
                  className={`p-2 ${
                    searchFilters.viewMode === 'list'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid/List */}
        {paginatedProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Grid className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilters({
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
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            <div className={`grid gap-6 ${
              searchFilters.viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1'
            }`}>
              {paginatedProducts.map(product => (
                <div key={product.id} className="relative group">
                  <ProductCard product={product} viewMode={searchFilters.viewMode} />
                  
                  {/* Overlay Actions */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isInWishlist(product.id)) {
                          handleRemoveFromWishlist(product.id);
                        } else {
                          handleAddToWishlist(product.id);
                        }
                      }}
                      className={`p-2 rounded-full shadow-md transition-colors ${
                        isInWishlist(product.id)
                          ? 'bg-red-500 text-white'
                          : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isInComparison(product.id)) {
                          handleRemoveFromComparison(product.id);
                        } else {
                          handleAddToComparison(product);
                        }
                      }}
                      disabled={!isInComparison(product.id) && comparisonProducts.length >= 3}
                      className={`p-2 rounded-full shadow-md transition-colors ${
                        isInComparison(product.id)
                          ? 'bg-blue-500 text-white'
                          : comparisonProducts.length >= 3
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-500'
                      }`}
                    >
                      <GitCompare className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-4 py-2 border rounded-lg transition-colors ${
                      currentPage === i + 1
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Filter Sidebar */}
      <ProductFilterComponent
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        searchFilters={searchFilters}
        onFiltersChange={setFilters}
        onSearchFiltersChange={setSearchFilters}
        resultCount={filteredProducts.length}
      />

      {/* Product Comparison Modal */}
      <ProductComparisonComponent
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        products={comparisonProducts}
        onRemoveProduct={handleRemoveFromComparison}
      />
    </div>
  );
};

export default Products;