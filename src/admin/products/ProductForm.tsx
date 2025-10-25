import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, Plus, Save, AlertCircle } from 'lucide-react';
import { Product } from '../../types/product';
import { adminProductService } from '../../services/adminProductService';

interface ProductFormProps {
  product?: Product | null;
  onSubmit?: (productData: any) => Promise<void>;
  onClose: () => void;
}

// Create an instance of adminProductService
// const adminProductService = new adminProductService(); // This line is redundant as we're importing the service

const ProductForm: React.FC<ProductFormProps> = ({ product, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subcategory: '',
    price: '',
    originalPrice: '',
    sku: '',
    description: '',
    shortDescription: '',
    craftsman: '',
    materials: [''],
    dimensions: '',
    weight: '',
    origin: '',
    stock: '',
    minQuantity: '1',
    maxQuantity: '10',
    tags: [''],
    hsn: '',
    taxRate: '0.18',
    careInstructions: [''],
    warranty: '',
    shippingWeight: '',
    shippingDimensions: {
      length: '',
      width: '',
      height: ''
    },
    metaTitle: '',
    metaDescription: '',
    isNew: false,
    isFeatured: false,
    isActive: true
  });

  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchCategories();
    if (product) {
      populateForm(product);
    }
  }, [product]);

  const fetchCategories = async () => {
    try {
      const response = await adminProductService.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const populateForm = (product: Product) => {
    setFormData({
      name: product.name || '',
      category: product.category || '',
      subcategory: product.subcategory || '',
      price: product.price?.toString() || '',
      originalPrice: product.originalPrice?.toString() || '',
      sku: product.sku || '',
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      craftsman: product.craftsman || '',
      materials: product.materials?.length ? product.materials : [''],
      dimensions: product.dimensions || '',
      weight: product.weight || '',
      origin: product.origin || '',
      stock: product.stock?.toString() || '',
      minQuantity: product.minQuantity?.toString() || '1',
      maxQuantity: product.maxQuantity?.toString() || '10',
      tags: product.tags?.length ? product.tags : [''],
      hsn: product.hsn || '',
      taxRate: product.taxRate?.toString() || '0.18',
      careInstructions: product.careInstructions?.length ? product.careInstructions : [''],
      warranty: product.warranty || '',
      shippingWeight: product.shippingWeight?.toString() || '',
      shippingDimensions: {
        length: product.shippingDimensions?.length?.toString() || '',
        width: product.shippingDimensions?.width?.toString() || '',
        height: product.shippingDimensions?.height?.toString() || ''
      },
      metaTitle: product.metaTitle || '',
      metaDescription: product.metaDescription || '',
      isNew: product.isNew || false,
      isFeatured: product.isFeatured || false,
      isActive: product.isActive !== false
    });

    if (product.images) {
      setExistingImages([product.image, ...product.images]);
    } else {
      setExistingImages([product.image]);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleArrayChange = (field: string, index: number, value: string) => {
    setFormData(prev => {
      const currentValue = prev[field as keyof typeof prev];
      if (Array.isArray(currentValue)) {
        return {
          ...prev,
          [field]: currentValue.map((item: string, i: number) => 
            i === index ? value : item
          )
        };
      }
      return prev;
    });
  };

  const addArrayItem = (field: string) => {
    setFormData(prev => {
      const currentValue = prev[field as keyof typeof prev];
      if (Array.isArray(currentValue)) {
        return {
          ...prev,
          [field]: [...currentValue, '']
        };
      }
      return {
        ...prev,
        [field]: ['']
      };
    });
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData(prev => {
      const currentValue = prev[field as keyof typeof prev];
      if (Array.isArray(currentValue)) {
        return {
          ...prev,
          [field]: currentValue.filter((_: any, i: number) => i !== index)
        };
      }
      return prev;
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.stock || parseInt(formData.stock) < 0) newErrors.stock = 'Valid stock quantity is required';

    // Validate that we have at least one image
    if (!product && images.length === 0) {
      newErrors.images = 'At least one product image is required';
    }
    if (product && existingImages.length === 0 && images.length === 0) {
      newErrors.images = 'At least one product image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = new FormData();

      // Add text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'materials' || key === 'tags' || key === 'careInstructions') {
          const arrayValue = value as string[];
          if (Array.isArray(arrayValue)) {
            // Convert array to JSON string to ensure proper transmission
            submitData.append(key, JSON.stringify(arrayValue.filter(item => item.trim())));
          }
        } else if (key === 'shippingDimensions') {
          const dims = value as any;
          // Convert object to JSON string
          submitData.append('shippingDimensions', JSON.stringify({
            length: dims.length || '',
            width: dims.width || '',
            height: dims.height || ''
          }));
        } else if (value !== null && value !== undefined) {
          // Convert numbers to strings
          submitData.append(key, value.toString());
        }
      });

      // Add new images
      if (images.length > 0) {
        // Add the first image as the main image
        submitData.append('image', images[0]);
        
        // Add remaining images as additional images
        if (images.length > 1) {
          images.slice(1).forEach((image) => {
            submitData.append('images', image);
          });
        }
      }

      // Add existing images to keep
      existingImages.forEach((imageUrl, index) => {
        submitData.append('existingImages[]', imageUrl);
      });

      // Use adminProductService directly if onSubmit is not provided
      if (onSubmit) {
        await onSubmit(submitData);
      } else {
        if (product && product._id) {
          await adminProductService.updateProduct(product._id, submitData);
        } else {
          await adminProductService.createProduct(submitData);
        }
        onClose(); // Close the form after successful submission
      }
    } catch (error) {
      console.error('Failed to save product:', error);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const errorClass = "text-red-600 text-sm mt-1";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={inputClass}
                  placeholder="Enter product name"
                />
                {errors.name && <p className={errorClass}>{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU *
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  className={inputClass}
                  placeholder="Enter SKU"
                />
                {errors.sku && <p className={errorClass}>{errors.sku}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                  <option value="new">+ Add New Category</option>
                </select>
                {errors.category && <p className={errorClass}>{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategory
                </label>
                <input
                  type="text"
                  value={formData.subcategory}
                  onChange={(e) => handleInputChange('subcategory', e.target.value)}
                  className={inputClass}
                  placeholder="Enter subcategory"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Craftsman
                </label>
                <input
                  type="text"
                  value={formData.craftsman}
                  onChange={(e) => handleInputChange('craftsman', e.target.value)}
                  className={inputClass}
                  placeholder="Enter craftsman name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Origin
                </label>
                <input
                  type="text"
                  value={formData.origin}
                  onChange={(e) => handleInputChange('origin', e.target.value)}
                  className={inputClass}
                  placeholder="e.g., Jodhpur, Rajasthan"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={inputClass}
                rows={4}
                placeholder="Enter detailed product description"
              />
              {errors.description && <p className={errorClass}>{errors.description}</p>}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Description
              </label>
              <textarea
                value={formData.shortDescription}
                onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                className={inputClass}
                rows={2}
                placeholder="Enter brief product description"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className={inputClass}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                {errors.price && <p className={errorClass}>{errors.price}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Original Price (₹)
                </label>
                <input
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                  className={inputClass}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Rate
                </label>
                <select
                  value={formData.taxRate}
                  onChange={(e) => handleInputChange('taxRate', e.target.value)}
                  className={inputClass}
                >
                  <option value="0">0% (No Tax)</option>
                  <option value="0.05">5% GST</option>
                  <option value="0.12">12% GST</option>
                  <option value="0.18">18% GST</option>
                  <option value="0.28">28% GST</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  HSN Code
                </label>
                <input
                  type="text"
                  value={formData.hsn}
                  onChange={(e) => handleInputChange('hsn', e.target.value)}
                  className={inputClass}
                  placeholder="Enter HSN code"
                />
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => handleInputChange('stock', e.target.value)}
                  className={inputClass}
                  placeholder="0"
                  min="0"
                />
                {errors.stock && <p className={errorClass}>{errors.stock}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Quantity
                </label>
                <input
                  type="number"
                  value={formData.minQuantity}
                  onChange={(e) => handleInputChange('minQuantity', e.target.value)}
                  className={inputClass}
                  placeholder="1"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Quantity
                </label>
                <input
                  type="number"
                  value={formData.maxQuantity}
                  onChange={(e) => handleInputChange('maxQuantity', e.target.value)}
                  className={inputClass}
                  placeholder="10"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Product Images */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h3>
            
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingImages.map((imageUrl, index) => (
                    <div key={index} className="relative">
                      <img
                        src={imageUrl}
                        alt={`Product ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          Main
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images */}
            {images.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">New Images</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`New ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <label className="cursor-pointer">
                <span className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Upload Images
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-600 mt-2">
                Upload multiple images. First image will be the main product image.
              </p>
            </div>
            {errors.images && <p className={errorClass}>{errors.images}</p>}
          </div>

          {/* Product Details */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
            
            {/* Materials */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Materials</label>
              {formData.materials.map((material, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => handleArrayChange('materials', index, e.target.value)}
                    className={inputClass}
                    placeholder="Enter material"
                  />
                  {formData.materials.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('materials', index)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('materials')}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Material
              </button>
            </div>

            {/* Tags */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              {formData.tags.map((tag, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => handleArrayChange('tags', index, e.target.value)}
                    className={inputClass}
                    placeholder="Enter tag"
                  />
                  {formData.tags.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('tags', index)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('tags')}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Tag
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dimensions
                </label>
                <input
                  type="text"
                  value={formData.dimensions}
                  onChange={(e) => handleInputChange('dimensions', e.target.value)}
                  className={inputClass}
                  placeholder="e.g., 120cm H x 70cm W x 65cm D"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight
                </label>
                <input
                  type="text"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className={inputClass}
                  placeholder="e.g., 35kg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warranty
                </label>
                <input
                  type="text"
                  value={formData.warranty}
                  onChange={(e) => handleInputChange('warranty', e.target.value)}
                  className={inputClass}
                  placeholder="e.g., 2 years against manufacturing defects"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping Weight (kg)
                </label>
                <input
                  type="number"
                  value={formData.shippingWeight}
                  onChange={(e) => handleInputChange('shippingWeight', e.target.value)}
                  className={inputClass}
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>

            {/* Care Instructions */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Care Instructions</label>
              {formData.careInstructions.map((instruction, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={instruction}
                    onChange={(e) => handleArrayChange('careInstructions', index, e.target.value)}
                    className={inputClass}
                    placeholder="Enter care instruction"
                  />
                  {formData.careInstructions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('careInstructions', index)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('careInstructions')}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Instruction
              </button>
            </div>
          </div>

          {/* SEO */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={formData.metaTitle}
                  onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                  className={inputClass}
                  placeholder="SEO title for search engines"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Description
                </label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                  className={inputClass}
                  rows={3}
                  placeholder="SEO description for search engines"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active (visible to customers)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-900">
                  Featured product
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isNew"
                  checked={formData.isNew}
                  onChange={(e) => handleInputChange('isNew', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isNew" className="ml-2 block text-sm text-gray-900">
                  New product
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {product ? 'Update Product' : 'Create Product'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;