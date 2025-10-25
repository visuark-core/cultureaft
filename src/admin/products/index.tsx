import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Star, 
  Package, 
  AlertTriangle,
  Download,
  Upload,
  Grid,
  List,
  MoreVertical
} from 'lucide-react';
import { Product } from '../../types/product';
import ProductForm from './ProductForm';
import EnhancedProductForm from './EnhancedProductForm';
import ProductDetails from './ProductDetails';
import { adminProductService } from '../../services/adminProductService';
import adminAuthService from '../../services/adminAuthService';
import AdminLogin from '../../components/AdminLogin';
import ProductIntegrationStatus from '../../components/ProductIntegrationStatus';

interface ProductsPageProps {}

const ProductsPage: React.FC<ProductsPageProps> = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [categories, setCategories] = useState<string[]>([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    outOfStock: 0,
    lowStock: 0,
    featured: 0
  });

  useEffect(() => {
    // Check authentication status
    setIsAuthenticated(adminAuthService.isAuthenticated());
    
    if (adminAuthService.isAuthenticated()) {
      fetchProducts();
      fetchCategories();
      fetchStatistics();
    }
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory, selectedStatus]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await adminProductService.getProducts();
      setProducts(response.data?.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await adminProductService.getCategories();
      setCategories(response.data?.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await adminProductService.getProductStatistics();
      const stats = response.data;
      setStatistics({
        total: stats?.stockStats?.[0]?.totalProducts || 0,
        active: (stats?.stockStats?.[0]?.totalProducts || 0) - (stats?.stockStats?.[0]?.outOfStock || 0),
        outOfStock: stats?.stockStats?.[0]?.outOfStock || 0,
        lowStock: stats?.stockStats?.[0]?.lowStock || 0,
        featured: stats?.featuredStats?.[0]?.featured || 0
      });
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      setStatistics({
        total: 0,
        active: 0,
        outOfStock: 0,
        lowStock: 0,
        featured: 0
      });
    }
  };

  const filterProducts = () => {
    if (!Array.isArray(products)) {
      setFilteredProducts([]);
      return;
    }

    let filtered = products;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product?.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product?.craftsman?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product?.category === selectedCategory);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      switch (selectedStatus) {
        case 'active':
          filtered = filtered.filter(product => product?.isActive && (product?.stock || 0) > 0);
          break;
        case 'inactive':
          filtered = filtered.filter(product => !product?.isActive);
          break;
        case 'out-of-stock':
          filtered = filtered.filter(product => (product?.stock || 0) === 0);
          break;
        case 'low-stock':
          filtered = filtered.filter(product => (product?.stock || 0) > 0 && (product?.stock || 0) <= 10);
          break;
        case 'featured':
          filtered = filtered.filter(product => product?.isFeatured);
          break;
        case 'new':
          filtered = filtered.filter(product => product?.isNew);
          break;
      }
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowDetails(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        await adminProductService.deleteProduct(productId);
        await fetchProducts();
        await fetchStatistics();
      } catch (error) {
        console.error('Failed to delete product:', error);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  const handleFormSubmit = async (productData: FormData) => {
    try {
      if (editingProduct && editingProduct.id) {
        await adminProductService.updateProduct(editingProduct.id, productData);
      } else {
        // Log FormData for debugging
        console.log('Submitting product data:');
        for (const pair of productData.entries()) {
          console.log(pair[0], pair[1]);
        }
        
        const response = await adminProductService.createProduct(productData);
        if (response.success) {
          alert('Product created successfully!');
        }
      }
      setShowForm(false);
      await fetchProducts();
      await fetchStatistics();
      await fetchCategories();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product. Please check the console for details.');
    }
  };

  const handleBulkAction = async (action: string, productIds: string[]) => {
    try {
      switch (action) {
        case 'activate':
          await adminProductService.bulkUpdateProducts(productIds, { isActive: true });
          break;
        case 'deactivate':
          await adminProductService.bulkUpdateProducts(productIds, { isActive: false });
          break;
        case 'feature':
          await adminProductService.bulkUpdateProducts(productIds, { isFeatured: true });
          break;
        case 'unfeature':
          await adminProductService.bulkUpdateProducts(productIds, { isFeatured: false });
          break;
      }
      await fetchProducts();
      await fetchStatistics();
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
      alert('Failed to perform bulk action. Please try again.');
    }
  };

  // Pagination
  const safeFilteredProducts = Array.isArray(filteredProducts) ? filteredProducts : [];
  const totalPages = Math.ceil(safeFilteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = safeFilteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'text-red-600 bg-red-100' };
    if (stock <= 10) return { label: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' };
    return { label: 'In Stock', color: 'text-green-600 bg-green-100' };
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    fetchProducts();
    fetchCategories();
    fetchStatistics();
  };

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600 mt-1">Manage your product catalog</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Welcome, {adminAuthService.getCurrentAdmin()?.email}
            </div>
            <button
              onClick={() => {
                adminAuthService.logout();
                setIsAuthenticated(false);
              }}
              className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Logout
            </button>
            <button
              onClick={handleCreateProduct}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
            >
              <Plus className="h-5 w-5" />
              Add Product
            </button>
          </div>
        </div>

        {/* Integration Status */}
        <div className="mb-6">
          <ProductIntegrationStatus />
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{statistics.active}</p>
              </div>
              <Eye className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{statistics.outOfStock}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.lowStock}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Featured</p>
                <p className="text-2xl font-bold text-purple-600">{statistics.featured}</p>
              </div>
              <Star className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {Array.isArray(categories) ? categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                )) : null}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="out-of-stock">Out of Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="featured">Featured</option>
                <option value="new">New</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
              </div>

              {/* Export Button */}
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products List/Grid */}
      {safeFilteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow border">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
              ? 'Try adjusting your filters to find products.'
              : 'Get started by adding your first product.'}
          </p>
          {!searchTerm && selectedCategory === 'all' && selectedStatus === 'all' && (
            <button
              onClick={handleCreateProduct}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Product
            </button>
          )}
        </div>
      ) : (
        <>
          {viewMode === 'list' ? (
            <div className="bg-white rounded-lg shadow border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedProducts.map((product) => {
                      const stockStatus = getStockStatus(product.stock || 0);
                      return (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-12 w-12 rounded-lg object-cover mr-4"
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {product.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  SKU: {product.sku}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{product.price?.toLocaleString() || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                              {product.stock || 0} units
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                product.isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                              }`}>
                                {product.isActive ? 'Active' : 'Inactive'}
                              </span>
                              {product.isFeatured && (
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              )}
                              {product.isNew && (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-blue-600 bg-blue-100">
                                  New
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewProduct(product)}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="text-green-600 hover:text-green-900 p-1"
                                title="Edit Product"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Delete Product"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock || 0);
                return (
                  <div key={product.id} className="bg-white rounded-lg shadow border overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-2 right-2 flex flex-col gap-1">
                        {product.isFeatured && (
                          <Star className="h-5 w-5 text-yellow-500 fill-current bg-white rounded-full p-1" />
                        )}
                        {product.isNew && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">New</span>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 truncate">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                      <p className="text-lg font-bold text-gray-900 mb-2">₹{product.price?.toLocaleString() || 'N/A'}</p>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                        <span className="text-sm text-gray-600">{product.stock || 0} units</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleViewProduct(product)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Edit Product"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, safeFilteredProducts.length)} of {safeFilteredProducts.length} products
              </div>
              <div className="flex items-center gap-2">
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
            </div>
          )}
        </>
      )}

      {/* Enhanced Product Form Modal */}
      {showForm && (
        <EnhancedProductForm
          product={editingProduct}
          onSubmit={handleFormSubmit}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Product Details Modal */}
      {showDetails && selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          onClose={() => setShowDetails(false)}
          onEdit={() => {
            setShowDetails(false);
            handleEditProduct(selectedProduct);
          }}
          onDelete={() => {
            setShowDetails(false);
            handleDeleteProduct(selectedProduct.id);
          }}
        />
      )}
    </div>
  );
};

export default ProductsPage;