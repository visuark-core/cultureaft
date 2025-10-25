import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Heart, 
  ShoppingCart, 
  Star, 
  Eye,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
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

interface RecommendationSection {
  title: string;
  description: string;
  products: Product[];
  type: 'trending' | 'similar' | 'wishlist' | 'recently_viewed' | 'personalized';
}

interface PersonalizedRecommendationsProps {
  userId?: string;
  currentProductId?: string;
  limit?: number;
}

const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  userId,
  currentProductId,
  limit = 8
}) => {
  const { addItem } = useCart();
  const [recommendations, setRecommendations] = useState<RecommendationSection[]>([]);
  const [activeSection, setActiveSection] = useState(0);
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);

  useEffect(() => {
    generateRecommendations();
    loadWishlist();
  }, [userId, currentProductId]);

  const loadWishlist = () => {
    const saved = localStorage.getItem('wishlist');
    if (saved) {
      const wishlist = JSON.parse(saved);
      setWishlistItems(wishlist.map((item: any) => item.productId));
    }
  };

  const generateRecommendations = () => {
    const sections: RecommendationSection[] = [];

    // Trending Products
    const trendingProducts = productsData
      .filter(p => p.isFeatured || p.rating >= 4.5)
      .slice(0, limit);
    
    if (trendingProducts.length > 0) {
      sections.push({
        title: 'Trending Now',
        description: 'Popular items that other customers are loving',
        products: trendingProducts,
        type: 'trending'
      });
    }

    // Recently Viewed (simulated)
    const recentlyViewed = getRecentlyViewedProducts();
    if (recentlyViewed.length > 0) {
      sections.push({
        title: 'Recently Viewed',
        description: 'Continue where you left off',
        products: recentlyViewed.slice(0, limit),
        type: 'recently_viewed'
      });
    }

    // Similar Products (if viewing a specific product)
    if (currentProductId) {
      const currentProduct = productsData.find(p => p.id === currentProductId);
      if (currentProduct) {
        const similarProducts = productsData
          .filter(p => 
            p.id !== currentProductId && 
            (p.metadata.category === currentProduct.metadata.category ||
             p.metadata.materials.some(m => currentProduct.metadata.materials.includes(m)))
          )
          .slice(0, limit);

        if (similarProducts.length > 0) {
          sections.push({
            title: 'Similar Products',
            description: 'You might also like these items',
            products: similarProducts,
            type: 'similar'
          });
        }
      }
    }

    // Personalized Recommendations (based on user behavior)
    const personalizedProducts = getPersonalizedProducts();
    if (personalizedProducts.length > 0) {
      sections.push({
        title: 'Recommended for You',
        description: 'Curated based on your preferences',
        products: personalizedProducts.slice(0, limit),
        type: 'personalized'
      });
    }

    // New Arrivals
    const newProducts = productsData
      .filter(p => p.isNew)
      .slice(0, limit);
    
    if (newProducts.length > 0) {
      sections.push({
        title: 'New Arrivals',
        description: 'Fresh additions to our collection',
        products: newProducts,
        type: 'trending'
      });
    }

    setRecommendations(sections);
  };

  const getRecentlyViewedProducts = (): Product[] => {
    const viewed = localStorage.getItem('recentlyViewed');
    if (viewed) {
      const viewedIds = JSON.parse(viewed);
      return viewedIds
        .map((id: string) => productsData.find(p => p.id === id))
        .filter(Boolean)
        .slice(0, limit);
    }
    return [];
  };

  const getPersonalizedProducts = (): Product[] => {
    // Simulate personalization based on user preferences
    // In a real app, this would use ML algorithms and user behavior data
    const userPreferences = getUserPreferences();
    
    return productsData
      .filter(product => {
        // Score products based on user preferences
        let score = 0;
        
        // Category preference
        if (userPreferences.categories.includes(product.metadata.category)) {
          score += 3;
        }
        
        // Material preference
        if (product.metadata.materials.some(m => userPreferences.materials.includes(m))) {
          score += 2;
        }
        
        // Price range preference
        if (product.pricing.basePrice >= userPreferences.priceRange.min && 
            product.pricing.basePrice <= userPreferences.priceRange.max) {
          score += 1;
        }
        
        // Rating preference
        if (product.rating >= 4.0) {
          score += 1;
        }
        
        return score >= 2;
      })
      .sort((a, b) => b.rating - a.rating);
  };

  const getUserPreferences = () => {
    // Simulate user preferences based on past behavior
    // In a real app, this would be stored in user profile or calculated from behavior
    return {
      categories: ['Furniture', 'Decor'],
      materials: ['Mahogany Wood', 'Teak Wood', 'Brass'],
      priceRange: { min: 5000, max: 50000 },
      craftsmen: ['Master Ravi Sharma', 'Artisan Mukesh Joshi']
    };
  };

  const addToRecentlyViewed = (productId: string) => {
    const viewed = localStorage.getItem('recentlyViewed');
    let viewedIds = viewed ? JSON.parse(viewed) : [];
    
    // Remove if already exists and add to beginning
    viewedIds = viewedIds.filter((id: string) => id !== productId);
    viewedIds.unshift(productId);
    
    // Keep only last 10 items
    viewedIds = viewedIds.slice(0, 10);
    
    localStorage.setItem('recentlyViewed', JSON.stringify(viewedIds));
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
  };

  const toggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const saved = localStorage.getItem('wishlist');
    let wishlist = saved ? JSON.parse(saved) : [];
    
    if (wishlistItems.includes(productId)) {
      wishlist = wishlist.filter((item: any) => item.productId !== productId);
    } else {
      wishlist.push({
        id: `wishlist-${Date.now()}`,
        productId,
        userId: userId || 'current-user',
        addedAt: new Date().toISOString()
      });
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    setWishlistItems(wishlist.map((item: any) => item.productId));
  };

  const getSectionIcon = (type: RecommendationSection['type']) => {
    switch (type) {
      case 'trending':
        return <TrendingUp className="h-5 w-5" />;
      case 'personalized':
        return <Sparkles className="h-5 w-5" />;
      case 'recently_viewed':
        return <Eye className="h-5 w-5" />;
      default:
        return <Star className="h-5 w-5" />;
    }
  };

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {recommendations.map((section, sectionIndex) => (
        <div key={sectionIndex} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                {getSectionIcon(section.type)}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
                <p className="text-gray-600 text-sm">{section.description}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {section.products.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                onClick={() => addToRecentlyViewed(product.id)}
                className="group block"
              >
                <div className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="relative overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
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
                    </div>

                    {/* Actions */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => toggleWishlist(product.id, e)}
                        className={`p-2 rounded-full shadow-md transition-colors ${
                          wishlistItems.includes(product.id)
                            ? 'bg-red-500 text-white'
                            : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${wishlistItems.includes(product.id) ? 'fill-current' : ''}`} />
                      </button>
                      
                      <button
                        onClick={(e) => handleAddToCart(product, e)}
                        className="p-2 bg-white text-gray-600 rounded-full shadow-md hover:bg-blue-50 hover:text-blue-500 transition-colors"
                      >
                        <ShoppingCart className="h-4 w-4" />
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
                    
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
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
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {section.products.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {getSectionIcon(section.type)}
              </div>
              <p className="text-gray-500">No recommendations available at the moment</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PersonalizedRecommendations;