import React, { useState } from 'react';
import { X, Edit, Trash2, Star, Package, Eye, EyeOff, Calendar, User, MapPin } from 'lucide-react';
import { Product } from '../../types/product';

interface ProductDetailsProps {
  product: Product;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product, onClose, onEdit, onDelete }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const allImages = product.images ? [product.image, ...product.images] : [product.image];

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'text-red-600 bg-red-100' };
    if (stock <= 10) return { label: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' };
    return { label: 'In Stock', color: 'text-green-600 bg-green-100' };
  };

  const stockStatus = getStockStatus(product.stock);
  const discountPercentage = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
            <p className="text-gray-600">SKU: {product.sku}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={onDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Product Images */}
            <div>
              <div className="bg-gray-100 rounded-lg overflow-hidden mb-4">
                <img
                  src={allImages[selectedImageIndex]}
                  alt={product.name}
                  className="w-full h-96 object-cover"
                />
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImageIndex === index ? 'border-blue-600' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  product.isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                }`}>
                  {product.isActive ? (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      Inactive
                    </>
                  )}
                </span>
                
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${stockStatus.color}`}>
                  <Package className="h-4 w-4 mr-1" />
                  {stockStatus.label}
                </span>

                {product.isFeatured && (
                  <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full text-purple-600 bg-purple-100">
                    <Star className="h-4 w-4 mr-1 fill-current" />
                    Featured
                  </span>
                )}

                {product.isNew && (
                  <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full text-blue-600 bg-blue-100">
                    New
                  </span>
                )}
              </div>

              {/* Category */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Category</h3>
                <p className="text-gray-600">
                  {product.category}
                  {product.subcategory && ` > ${product.subcategory}`}
                </p>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Pricing</h3>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-gray-900">
                    ₹{product.price.toLocaleString()}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        ₹{product.originalPrice.toLocaleString()}
                      </span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold">
                        {discountPercentage}% OFF
                      </span>
                    </>
                  )}
                </div>
                {product.taxRate && (
                  <p className="text-sm text-gray-600 mt-1">
                    Tax Rate: {(product.taxRate * 100).toFixed(0)}% GST
                    {product.hsn && ` (HSN: ${product.hsn})`}
                  </p>
                )}
              </div>

              {/* Stock Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Inventory</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Current Stock</p>
                    <p className="text-xl font-semibold text-gray-900">{product.stock}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Min Quantity</p>
                    <p className="text-xl font-semibold text-gray-900">{product.minQuantity || 1}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Max Quantity</p>
                    <p className="text-xl font-semibold text-gray-900">{product.maxQuantity || 10}</p>
                  </div>
                </div>
              </div>

              {/* Rating */}
              {product.rating && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Rating</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.floor(product.rating) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-gray-600">
                      {product.rating.toFixed(1)}
                      {product.reviewCount && ` (${product.reviewCount} reviews)`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Description */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
              <p className="text-gray-600 leading-relaxed mb-4">{product.description}</p>
              {product.shortDescription && (
                <>
                  <h4 className="font-semibold text-gray-800 mb-2">Short Description</h4>
                  <p className="text-gray-600">{product.shortDescription}</p>
                </>
              )}
            </div>

            {/* Product Details */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
              <div className="space-y-3">
                {product.craftsman && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Craftsman:</span>
                    <span className="text-sm font-medium text-gray-900">{product.craftsman}</span>
                  </div>
                )}

                {product.origin && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Origin:</span>
                    <span className="text-sm font-medium text-gray-900">{product.origin}</span>
                  </div>
                )}

                {product.dimensions && (
                  <div>
                    <span className="text-sm text-gray-600">Dimensions:</span>
                    <span className="text-sm font-medium text-gray-900 ml-2">{product.dimensions}</span>
                  </div>
                )}

                {product.weight && (
                  <div>
                    <span className="text-sm text-gray-600">Weight:</span>
                    <span className="text-sm font-medium text-gray-900 ml-2">{product.weight}</span>
                  </div>
                )}

                {product.warranty && (
                  <div>
                    <span className="text-sm text-gray-600">Warranty:</span>
                    <span className="text-sm font-medium text-gray-900 ml-2">{product.warranty}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Materials */}
            {product.materials && product.materials.length > 0 && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Materials</h3>
                <div className="flex flex-wrap gap-2">
                  {product.materials.map((material, index) => (
                    <span
                      key={index}
                      className="inline-flex px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-full"
                    >
                      {material}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex px-3 py-1 text-sm font-medium text-gray-600 bg-gray-200 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Care Instructions */}
            {product.careInstructions && product.careInstructions.length > 0 && (
              <div className="bg-gray-50 p-6 rounded-lg lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Care Instructions</h3>
                <ul className="list-disc list-inside space-y-1">
                  {product.careInstructions.map((instruction, index) => (
                    <li key={index} className="text-gray-600">{instruction}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Shipping Information */}
            {(product.shippingWeight || product.shippingDimensions) && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h3>
                <div className="space-y-2">
                  {product.shippingWeight && (
                    <div>
                      <span className="text-sm text-gray-600">Shipping Weight:</span>
                      <span className="text-sm font-medium text-gray-900 ml-2">{product.shippingWeight} kg</span>
                    </div>
                  )}
                  {product.shippingDimensions && (
                    <div>
                      <span className="text-sm text-gray-600">Shipping Dimensions:</span>
                      <span className="text-sm font-medium text-gray-900 ml-2">
                        {product.shippingDimensions.length} × {product.shippingDimensions.width} × {product.shippingDimensions.height} cm
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SEO Information */}
            {(product.metaTitle || product.metaDescription) && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Information</h3>
                <div className="space-y-3">
                  {product.metaTitle && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Meta Title</h4>
                      <p className="text-sm text-gray-600">{product.metaTitle}</p>
                    </div>
                  )}
                  {product.metaDescription && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Meta Description</h4>
                      <p className="text-sm text-gray-600">{product.metaDescription}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="bg-gray-50 p-6 rounded-lg lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.createdAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Created:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {product.updatedAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Last Updated:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(product.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;