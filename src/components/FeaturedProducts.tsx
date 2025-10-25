
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  sku: string;
  stock: number;
  maxQuantity: number;
  rating: number;
  isFeatured: boolean;
  isNew: boolean;
}

const FeaturedProducts = () => {
  const { addItem } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await fetch('/api/products/featured?limit=4');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setFeaturedProducts(result.data);
          }
        }
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const handleAddToCart = (product: any) => {
    addItem(product, 1);
  };

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-blue-900 mb-4">Featured Collections</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover our handpicked selection of masterful furniture and decorative pieces,
            each carrying the soul of Jodhpur's rich artistic heritage.
          </p>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                <div className="w-full h-64 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
            <div key={product.id} className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
              {/* Product Image */}
              <div className="relative overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.isNew && (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      New
                    </span>
                  )}
                  {product.isFeatured && (
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Featured
                    </span>
                  )}
                </div>

                {/* Hover Actions */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button className="p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors">
                    <Heart className="h-5 w-5 text-gray-600 hover:text-red-500" />
                  </button>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="p-2 bg-white rounded-full shadow-md hover:bg-blue-50 transition-colors"
                  >
                    <ShoppingCart className="h-5 w-5 text-gray-600 hover:text-blue-500" />
                  </button>
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* Product Info */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-orange-600 font-semibold">{product.metadata.category}</span>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-1 h-1 bg-orange-400 rounded-full mx-0.5"></div>
                    ))}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-blue-900 mb-2 group-hover:text-orange-600 transition-colors">
                  {product.name}
                </h3>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {product.description}
                </p>

                <p className="text-xs text-blue-600 mb-4">by {product.metadata.craftsman}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold text-blue-900">
                      ₹{product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-sm text-gray-500 line-through">
                        ₹{product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  to={`/product/${product.id}`}
                  className="mt-4 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center group/btn"
                >
                  View Details
                  <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No featured products available at the moment.</p>
          </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link
            to="/products/furniture"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-full hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
          >
            View All Furniture
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;