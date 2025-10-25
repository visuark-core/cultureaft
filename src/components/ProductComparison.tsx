import React, { useState, useEffect } from 'react';
import { X, Plus, Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '../data/products';
import { ProductComparison } from '../types/product';

interface ProductComparisonProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onRemoveProduct: (productId: string) => void;
}

const ProductComparisonComponent: React.FC<ProductComparisonProps> = ({
  isOpen,
  onClose,
  products,
  onRemoveProduct
}) => {
  const [comparisonData, setComparisonData] = useState<ProductComparison[]>([]);

  useEffect(() => {
    const data = products.map(product => ({
      id: product.id,
      name: product.name,
      image: product.image,
      price: product.pricing.basePrice,
      rating: product.rating,
      features: [
        `Category: ${product.metadata.category}`,
        `Materials: ${product.metadata.materials.join(', ')}`,
        `Craftsman: ${product.metadata.craftsman}`,
        `Origin: ${product.metadata.origin}`,
        `Dimensions: ${product.metadata.dimensions}`,
        `Weight: ${product.metadata.weight}`,
        ...(product.metadata.careInstructions || []).map(instruction => `Care: ${instruction}`),
        ...(product.metadata.warranty ? [`Warranty: ${product.metadata.warranty}`] : [])
      ]
    }));
    setComparisonData(data);
  }, [products]);

  if (!isOpen) return null;

  const allFeatureTypes = new Set<string>();
  
  comparisonData.forEach(product => {
    product.features.forEach(feature => {
      const type = feature.split(':')[0];
      allFeatureTypes.add(type);
    });
  });

  const getFeatureValue = (product: ProductComparison, featureType: string): string => {
    const feature = product.features.find(f => f.startsWith(featureType + ':'));
    return feature ? feature.split(':').slice(1).join(':').trim() : '-';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-xl max-h-[80vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Compare Products ({products.length})
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {products.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products to compare</h3>
                <p className="text-gray-500">Add products to comparison to see detailed comparisons</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <div className="p-6">
                {/* Product Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {comparisonData.map(product => (
                    <div key={product.id} className="bg-gray-50 rounded-xl p-4 relative">
                      <button
                        onClick={() => onRemoveProduct(product.id)}
                        className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      
                      <div className="text-center mb-4">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-24 h-24 object-cover rounded-lg mx-auto mb-3"
                        />
                        <h3 className="font-semibold text-gray-900 text-sm mb-1">{product.name}</h3>
                        <div className="flex items-center justify-center mb-2">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
                        </div>
                        <div className="text-lg font-bold text-blue-900">
                          ₹{product.price.toLocaleString()}
                        </div>
                      </div>
                      
                      <Link
                        to={`/product/${product.id}`}
                        className="block w-full bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        View Details
                        <ArrowRight className="h-4 w-4 inline ml-1" />
                      </Link>
                    </div>
                  ))}
                </div>

                {/* Comparison Table */}
                {products.length > 1 && (
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Detailed Comparison</h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left p-4 font-medium text-gray-900 bg-gray-50 sticky left-0">
                              Feature
                            </th>
                            {comparisonData.map(product => (
                              <th key={product.id} className="text-center p-4 font-medium text-gray-900 min-w-48">
                                {product.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-100">
                            <td className="p-4 font-medium text-gray-900 bg-gray-50 sticky left-0">Price</td>
                            {comparisonData.map(product => (
                              <td key={product.id} className="p-4 text-center">
                                <span className="text-lg font-bold text-blue-900">
                                  ₹{product.price.toLocaleString()}
                                </span>
                              </td>
                            ))}
                          </tr>
                          
                          <tr className="border-b border-gray-100">
                            <td className="p-4 font-medium text-gray-900 bg-gray-50 sticky left-0">Rating</td>
                            {comparisonData.map(product => (
                              <td key={product.id} className="p-4 text-center">
                                <div className="flex items-center justify-center">
                                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                  <span className="ml-1">{product.rating}</span>
                                </div>
                              </td>
                            ))}
                          </tr>

                          {Array.from(allFeatureTypes).map(featureType => (
                            <tr key={featureType} className="border-b border-gray-100">
                              <td className="p-4 font-medium text-gray-900 bg-gray-50 sticky left-0">
                                {featureType}
                              </td>
                              {comparisonData.map(product => (
                                <td key={product.id} className="p-4 text-center text-sm text-gray-700">
                                  {getFeatureValue(product, featureType)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductComparisonComponent;