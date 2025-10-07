import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, ShoppingCart, Star, Truck, Shield, RotateCcw, Award } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { productsData } from '../data/products';

const ProductDetail = () => {
  const { id } = useParams();
  const { addItem } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  const product = productsData.find(p => p.id === id);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Product not found</h2>
          <Link to="/products" className="text-blue-600 hover:text-blue-800">
            ← Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [product.image];

  const addToCart = () => {
    if (product) {
      addItem(product, quantity);
    }
  };

  const features = [
    { icon: Truck, title: 'Free Shipping', description: 'Free delivery across India' },
    { icon: Shield, title: 'Authentic Craft', description: 'Certified traditional handicraft' },
    { icon: RotateCcw, title: '30-Day Returns', description: 'Easy return policy' },
    { icon: Award, title: 'Master Crafted', description: 'By skilled artisans' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center mb-8">
          <Link to="/products" className="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Products
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <div>
            {/* Main Image */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-96 lg:h-[500px] object-cover"
              />
            </div>

            {/* Thumbnail Images */}
            <div className="flex space-x-4">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index ? 'border-blue-600' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} view ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {/* Category and Rating */}
              <div className="flex items-center justify-between mb-4">
                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {product.metadata.category}
                </span>
                <div className="flex items-center">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(product.rating || 0) 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-gray-600">({product.rating})</span>
                </div>
              </div>

              {/* Product Name */}
              <h1 className="text-3xl font-bold text-blue-900 mb-2">{product.name}</h1>
              
              {/* Craftsman */}
              <p className="text-lg text-blue-600 mb-6">Crafted by {product.metadata.craftsman}</p>

              {/* Price */}
              <div className="flex items-center space-x-4 mb-6">
                <span className="text-3xl font-bold text-blue-900">
                  ₹{product.pricing.basePrice.toLocaleString()}
                </span>
                {product.pricing.originalPrice && product.pricing.originalPrice > product.pricing.basePrice && (
                  <>
                    <span className="text-xl text-gray-500 line-through">
                      ₹{product.pricing.originalPrice.toLocaleString()}
                    </span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold">
                      Save ₹{(product.pricing.originalPrice - product.pricing.basePrice).toLocaleString()}
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>

              {/* Quantity and Actions */}
              <div className="flex items-center space-x-4 mb-8">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-gray-600 hover:text-blue-600"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 text-gray-600 hover:text-blue-600"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={addToCart}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </button>

                <button className="p-3 border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors">
                  <Heart className="h-5 w-5 text-gray-600 hover:text-red-500" />
                </button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{feature.title}</p>
                      <p className="text-gray-600 text-xs">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-16">
          {/* Tab Navigation */}
          <div className="flex border-b">
            {['description', 'specifications', 'craftmanship', 'shipping'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-semibold transition-colors capitalize ${
                  activeTab === tab 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'description' && (
              <div>
                <h3 className="text-2xl font-bold text-blue-900 mb-4">Product Description</h3>
                <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>
                <p className="text-gray-600 leading-relaxed">
                  This exquisite piece represents the finest tradition of Jodhpur craftsmanship, 
                  where every detail is meticulously crafted by skilled artisans who have 
                  inherited their techniques through generations. The rich cultural heritage 
                  of Rajasthan comes alive in every curve and carving.
                </p>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div>
                <h3 className="text-2xl font-bold text-blue-900 mb-4">Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Materials</h4>
                    <ul className="text-gray-600 space-y-1">
                      {product.metadata.materials?.map((material, index) => (
                        <li key={index}>• {material}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Dimensions</h4>
                    <p className="text-gray-600">{product.metadata.dimensions}</p>
                    
                    <h4 className="font-semibold text-gray-800 mb-2 mt-4">Weight</h4>
                    <p className="text-gray-600">{product.metadata.weight}</p>
                    
                    <h4 className="font-semibold text-gray-800 mb-2 mt-4">Origin</h4>
                    <p className="text-gray-600">{product.metadata.origin}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'craftmanship' && (
              <div>
                <h3 className="text-2xl font-bold text-blue-900 mb-4">Master Craftsmanship</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Crafted by {product.metadata.craftsman}, a master artisan with over 20 years of experience
                  in traditional Rajasthani woodwork. This piece showcases the intricate techniques 
                  passed down through generations of skilled craftspeople in Jodhpur.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Each element is hand-carved using traditional tools, with careful attention to 
                  the symbolic motifs that are deeply rooted in Rajasthani culture. The finishing 
                  process alone takes several days to achieve the perfect texture and color depth.
                </p>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div>
                <h3 className="text-2xl font-bold text-blue-900 mb-4">Shipping & Delivery</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Delivery Time</h4>
                    <p className="text-gray-600">7-14 business days for most locations in India</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Packaging</h4>
                    <p className="text-gray-600">
                      Carefully packaged with protective materials to ensure safe delivery
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Installation</h4>
                    <p className="text-gray-600">
                      Professional installation service available for furniture items
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;