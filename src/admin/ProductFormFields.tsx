import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, Upload, AlertCircle } from 'lucide-react';

interface ProductFormData {
  name: string;
  brand: string;
  sku: string;
  productId: string;
  category: string;
  subcategory: string;
  modelNumber: string;
  description: string;
  shortDescription: string;
  keyFeatures: string[];
  highlights: string[];
  pricing: {
    basePrice: number;
    salePrice?: number;
    currency: string;
    taxRate: number;
  };
  inventory: {
    stock: number;
    lowStockThreshold: number;
    autoReorderPoint: number;
    warehouseLocation: string;
  };
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    unit: string;
  };
  weight: {
    value?: number;
    unit: string;
  };
  materials: string[];
  colors: Array<{ name: string; code: string }>;
  status: string;
  countryOfOrigin: string;
  manufacturer: {
    name: string;
    address: string;
    contactInfo: string;
  };
  warranty: {
    duration?: number;
    type: string;
    terms: string;
  };
  tags: string[];
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
  };
}

interface ProductFormFieldsProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  mode?: 'create' | 'edit';
}

const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const sectionClass = "bg-white rounded-lg shadow p-6 mb-6";
const sectionHeaderClass = "flex items-center gap-2 text-lg font-semibold mb-4 text-gray-800";

const ProductFormFields: React.FC<ProductFormFieldsProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  mode = 'create'
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    brand: '',
    sku: '',
    productId: '',
    category: '',
    subcategory: '',
    modelNumber: '',
    description: '',
    shortDescription: '',
    keyFeatures: [''],
    highlights: [''],
    pricing: {
      basePrice: 0,
      salePrice: undefined,
      currency: 'INR',
      taxRate: 0
    },
    inventory: {
      stock: 0,
      lowStockThreshold: 10,
      autoReorderPoint: 5,
      warehouseLocation: 'Main Warehouse'
    },
    dimensions: {
      length: undefined,
      width: undefined,
      height: undefined,
      unit: 'cm'
    },
    weight: {
      value: undefined,
      unit: 'kg'
    },
    materials: [''],
    colors: [{ name: '', code: '' }],
    status: 'active',
    countryOfOrigin: '',
    manufacturer: {
      name: '',
      address: '',
      contactInfo: ''
    },
    warranty: {
      duration: undefined,
      type: 'manufacturer',
      terms: ''
    },
    tags: [''],
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: ['']
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const keys = field.split('.');
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      } else {
        const [parent, child] = keys;
        return {
          ...prev,
          [parent]: {
            ...prev[parent as keyof ProductFormData],
            [child]: value
          }
        };
      }
    });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleArrayChange = (field: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field as keyof ProductFormData].map((item: any, i: number) => 
        i === index ? value : item
      )
    }));
  };

  const addArrayItem = (field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field as keyof ProductFormData], field === 'colors' ? { name: '', code: '' } : '']
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field as keyof ProductFormData].filter((_: any, i: number) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (!formData.pricing.basePrice || formData.pricing.basePrice <= 0) {
      newErrors['pricing.basePrice'] = 'Base price must be greater than 0';
    }

    if (formData.inventory.stock < 0) {
      newErrors['inventory.stock'] = 'Stock cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Clean up empty array items
    const cleanedData = {
      ...formData,
      keyFeatures: formData.keyFeatures.filter(f => f.trim()),
      highlights: formData.highlights.filter(h => h.trim()),
      materials: formData.materials.filter(m => m.trim()),
      colors: formData.colors.filter(c => c.name.trim() || c.code.trim()),
      tags: formData.tags.filter(t => t.trim()),
      seo: {
        ...formData.seo,
        keywords: formData.seo.keywords.filter(k => k.trim())
      }
    };

    onSubmit(cleanedData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl mx-auto">
      {/* Basic Information */}
      <section className={sectionClass}>
        <h3 className={sectionHeaderClass}>
          <span>📦</span> Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`${inputClass} ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Enter product name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => handleInputChange('brand', e.target.value)}
              className={inputClass}
              placeholder="Brand name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => handleInputChange('sku', e.target.value)}
              className={inputClass}
              placeholder="Stock Keeping Unit"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={`${inputClass} ${errors.category ? 'border-red-500' : ''}`}
              placeholder="Product category"
            />
            {errors.category && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.category}
              </p>
            )}
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
              placeholder="Product subcategory"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className={inputClass}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending_approval">Pending Approval</option>
            </select>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className={sectionClass}>
        <h3 className={sectionHeaderClass}>
          <span>💰</span> Pricing
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base Price *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.pricing.basePrice}
              onChange={(e) => handleInputChange('pricing.basePrice', parseFloat(e.target.value) || 0)}
              className={`${inputClass} ${errors['pricing.basePrice'] ? 'border-red-500' : ''}`}
              placeholder="0.00"
            />
            {errors['pricing.basePrice'] && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors['pricing.basePrice']}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sale Price
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.pricing.salePrice || ''}
              onChange={(e) => handleInputChange('pricing.salePrice', e.target.value ? parseFloat(e.target.value) : undefined)}
              className={inputClass}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              value={formData.pricing.currency}
              onChange={(e) => handleInputChange('pricing.currency', e.target.value)}
              className={inputClass}
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax Rate (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.pricing.taxRate}
              onChange={(e) => handleInputChange('pricing.taxRate', parseFloat(e.target.value) || 0)}
              className={inputClass}
              placeholder="0.00"
            />
          </div>
        </div>
      </section>
      {/* Inventory */}
      <section className={sectionClass}>
        <h3 className={sectionHeaderClass}>
          <span>📦</span> Inventory
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Quantity
            </label>
            <input
              type="number"
              min="0"
              value={formData.inventory.stock}
              onChange={(e) => handleInputChange('inventory.stock', parseInt(e.target.value) || 0)}
              className={`${inputClass} ${errors['inventory.stock'] ? 'border-red-500' : ''}`}
              placeholder="0"
            />
            {errors['inventory.stock'] && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors['inventory.stock']}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Low Stock Threshold
            </label>
            <input
              type="number"
              min="0"
              value={formData.inventory.lowStockThreshold}
              onChange={(e) => handleInputChange('inventory.lowStockThreshold', parseInt(e.target.value) || 0)}
              className={inputClass}
              placeholder="10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Auto Reorder Point
            </label>
            <input
              type="number"
              min="0"
              value={formData.inventory.autoReorderPoint}
              onChange={(e) => handleInputChange('inventory.autoReorderPoint', parseInt(e.target.value) || 0)}
              className={inputClass}
              placeholder="5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warehouse Location
            </label>
            <input
              type="text"
              value={formData.inventory.warehouseLocation}
              onChange={(e) => handleInputChange('inventory.warehouseLocation', e.target.value)}
              className={inputClass}
              placeholder="Main Warehouse"
            />
          </div>
        </div>
      </section>

      {/* Description */}
      <section className={sectionClass}>
        <h3 className={sectionHeaderClass}>
          <span>📝</span> Description & Features
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short Description
            </label>
            <textarea
              value={formData.shortDescription}
              onChange={(e) => handleInputChange('shortDescription', e.target.value)}
              className={inputClass}
              rows={2}
              placeholder="Brief product description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Detailed Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={inputClass}
              rows={4}
              placeholder="Detailed product description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key Features
            </label>
            {formData.keyFeatures.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => handleArrayChange('keyFeatures', index, e.target.value)}
                  className={inputClass}
                  placeholder="Enter key feature"
                />
                {formData.keyFeatures.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('keyFeatures', index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('keyFeatures')}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Feature
            </button>
          </div>
        </div>
      </section>

      {/* Physical Properties */}
      <section className={sectionClass}>
        <h3 className={sectionHeaderClass}>
          <span>📏</span> Physical Properties
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dimensions
            </label>
            <div className="grid grid-cols-4 gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.dimensions.length || ''}
                onChange={(e) => handleInputChange('dimensions.length', e.target.value ? parseFloat(e.target.value) : undefined)}
                className={inputClass}
                placeholder="Length"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.dimensions.width || ''}
                onChange={(e) => handleInputChange('dimensions.width', e.target.value ? parseFloat(e.target.value) : undefined)}
                className={inputClass}
                placeholder="Width"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.dimensions.height || ''}
                onChange={(e) => handleInputChange('dimensions.height', e.target.value ? parseFloat(e.target.value) : undefined)}
                className={inputClass}
                placeholder="Height"
              />
              <select
                value={formData.dimensions.unit}
                onChange={(e) => handleInputChange('dimensions.unit', e.target.value)}
                className={inputClass}
              >
                <option value="cm">cm</option>
                <option value="inch">inch</option>
                <option value="m">m</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.weight.value || ''}
                onChange={(e) => handleInputChange('weight.value', e.target.value ? parseFloat(e.target.value) : undefined)}
                className={inputClass}
                placeholder="Weight"
              />
              <select
                value={formData.weight.unit}
                onChange={(e) => handleInputChange('weight.unit', e.target.value)}
                className={inputClass}
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="lb">lb</option>
                <option value="oz">oz</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* SEO */}
      <section className={sectionClass}>
        <h3 className={sectionHeaderClass}>
          <span>🔍</span> SEO & Marketing
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Title
            </label>
            <input
              type="text"
              value={formData.seo.metaTitle}
              onChange={(e) => handleInputChange('seo.metaTitle', e.target.value)}
              className={inputClass}
              placeholder="SEO meta title"
              maxLength={60}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.seo.metaTitle.length}/60 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Description
            </label>
            <textarea
              value={formData.seo.metaDescription}
              onChange={(e) => handleInputChange('seo.metaDescription', e.target.value)}
              className={inputClass}
              rows={2}
              placeholder="SEO meta description"
              maxLength={160}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.seo.metaDescription.length}/160 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            {formData.tags.map((tag, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
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
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('tags')}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Tag
            </button>
          </div>
        </div>
      </section>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center"
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {mode === 'create' ? 'Create Product' : 'Update Product'}
        </button>
      </div>
    </form>
  );
};

export default ProductFormFields;