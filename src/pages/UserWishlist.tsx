import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  craftsman: string;
}

const UserWishlist = () => {
  // In a real app, this would come from an API/context
  const [wishlist, setWishlist] = useState<WishlistItem[]>([
    {
      id: '1',
      name: 'Hand Carved Wooden Chair',
      price: 15000,
      description: 'Beautifully crafted chair with traditional Rajasthani design',
      image: 'https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg',
      category: 'Furniture',
      craftsman: 'Master Craftsman Gopal Singh'
    },
    {
      id: '2',
      name: 'Brass Inlay Coffee Table',
      price: 22000,
      description: 'Elegant coffee table with intricate brass inlay work',
      image: 'https://images.pexels.com/photos/2762247/pexels-photo-2762247.jpeg',
      category: 'Furniture',
      craftsman: 'Artisan Mohammad Rafiq'
    },
    {
      id: '3',
      name: 'Traditional Wall Mirror',
      price: 18500,
      description: 'Hand-carved wooden frame mirror with antique finish',
      image: 'https://images.pexels.com/photos/1099816/pexels-photo-1099816.jpeg',
      category: 'Decor',
      craftsman: 'Heritage Artisan Ramesh Kumar'
    }
  ]);

  const { dispatch } = useCart();

  const removeFromWishlist = (id: string) => {
    setWishlist(prevWishlist => prevWishlist.filter(item => item.id !== id));
  };

  const addToCart = (item: WishlistItem) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        category: item.category
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-blue-900 mb-2">My Wishlist</h1>
            <p className="text-gray-600">
              {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
          <Link
            to="/dashboard"
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        {wishlist.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-blue-900 mb-2">Your Wishlist is Empty</h2>
            <p className="text-gray-600 mb-6">Browse our collection and save items you love!</p>
            <Link
              to="/products/furniture"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {wishlist.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Product Image */}
                    <Link to={`/product/${item.id}`}>
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-32 h-32 object-cover rounded-lg shadow"
                      />
                    </Link>

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link 
                            to={`/product/${item.id}`}
                            className="text-xl font-semibold text-blue-900 hover:text-blue-700 transition-colors"
                          >
                            {item.name}
                          </Link>
                          <p className="text-gray-600 mt-1">{item.description}</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Crafted by {item.craftsman}
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">
                          ₹{item.price.toLocaleString()}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center gap-4">
                        <button
                          onClick={() => addToCart(item)}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </button>
                        <button
                          onClick={() => removeFromWishlist(item.id)}
                          className="inline-flex items-center px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserWishlist;
