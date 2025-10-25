import React, { useState } from 'react';
import { Heart, ShoppingCart, X, Share2, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '../data/products';
import { WishlistItem } from '../types/product';
import { useCart } from '../context/CartContext';

interface WishlistProps {
  wishlistItems: WishlistItem[];
  products: Product[];
  onRemoveFromWishlist: (productId: string) => void;
}

const Wishlist: React.FC<WishlistProps> = ({
  wishlistItems,
  products,
  onRemoveFromWishlist
}) => {
  const { addItem } = useCart();
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price-low' | 'price-high' | 'name'>('newest');
  const [filterBy, setFilterBy] = useState<'all' | 'available' | 'unavailable'>('all');

  // Get products that are in wishlist
  const wishlistProducts = products.filter(product =>
    wishlistItems.some(item => item.productId === product.id)
  );

  // Apply filters
  const filteredProducts = wishlistProducts.filter(product => {
    switch (filterBy) {
      case 'available':
        return product.pricing.isAvailable;
      case 'unavailable':
        return !product.pricing.isAvailable;
      default:
        return true;
    }
  });

  // Apply sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aWishlistItem = wishlistItems.find(item => item.productId === a.id);
    const bWishlistItem = wishlistItems.find(item => item.productId === b.id);

    switch (sortBy) {
      case 'newest':
        return new Date(bWishlistItem?.addedAt || 0).getTime() - new Date(aWishlistItem?.addedAt || 0).getTime();
      case 'oldest':
        return new Date(aWishlistItem?.addedAt || 0).getTime() - new Date(bWishlistItem?.addedAt || 0).getTime();
      case 'price-low':
        return a.pricing.basePrice - b.pricing.basePrice;
      case 'price-high':
        return b.pricing.basePrice - a.pricing.basePrice;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
  };

  const handleShare = async (product: Product) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: `${window.location.origin}/product/${product.id}`
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      const url = `${window.location.origin}/product/${product.id}`;
      navigator.clipboard.writeText(url);
      // You could show a toast notification here
    }
  };

  const getWishlistDate = (productId: string): string => {
    const item = wishlistItems.find(item => item.productId === productId);
    if (!item) return '';
    
    return new Date(item.addedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-600 mt-1">
            {wishlistProducts.length} item{wishlistProducts.length !== 1 ? 's' : ''} saved
          </p>
        </div>

        {wishlistProducts.length > 0 && (
          <div className="flex items-center space-x-4">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as typeof filterBy)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Items</option>
              <option value="available">Available</option>
              <option value="unavailable">Out of Stock</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Recently Added</option>
              <option value="oldest">Oldest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        )}
      </div>

      {/* Wishlist Items */}
      {sortedProducts.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {wishlistProducts.length === 0 ? 'Your wishlist is empty' : 'No items match your filters'}
          </h3>
          <p className="text-gray-600 mb-6">
            {wishlistProducts.length === 0 
              ? 'Save items you love to your wishlist and shop them later'
              : 'Try adjusting your filters to see more items'
            }
          </p>
          {wishlistProducts.length === 0 && (
            <Link
              to="/products"
              className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Browse Products
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProducts.map(product => (
            <div key={product.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <Link to={`/product/${product.id}`}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                </Link>
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {product.isNew && (
                    <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      New
                    </span>
                  )}
                  {product.isFeatured && (
                    <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      Featured
                    </span>
                  )}
                  {!product.pricing.isAvailable && (
                    <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                  <button
                    onClick={() => onRemoveFromWishlist(product.id)}
                    className="p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </button>
                  <button
                    onClick={() => handleShare(product)}
                    className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                  >
                    <Share2 className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-orange-600 font-semibold">
                    {product.metadata.category}
                  </span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
                  </div>
                </div>

                <Link to={`/product/${product.id}`}>
                  <h3 className="font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                </Link>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {product.description}
                </p>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-blue-900">
                      ₹{product.pricing.basePrice.toLocaleString()}
                    </span>
                    {product.pricing.originalPrice && product.pricing.originalPrice > product.pricing.basePrice && (
                      <span className="text-sm text-gray-500 line-through">
                        ₹{product.pricing.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-3">
                  Added {getWishlistDate(product.id)}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.pricing.isAvailable}
                    className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      product.pricing.isAvailable
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {product.pricing.isAvailable ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                  
                  <Link
                    to={`/product/${product.id}`}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;