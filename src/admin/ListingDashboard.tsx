

import React, { useState } from 'react';

type Product = {
  id: number;
  name: string;
  sku: string;
  brand: string;
  category: string;
  price: number;
  discount: number;
  stock: number;
  status: 'Active' | 'Inactive';
  rating: number;
  mainImage: string;
  additionalImages: string[];
  description: string;
};


const initialProducts: Product[] = [
  {
    id: 1,
    name: 'Hand Carved Chair',
    sku: 'CHAIR-001',
    brand: 'HeritageWood',
    category: 'Furniture',
    price: 12000,
    discount: 10,
    stock: 15,
    status: 'Active',
    rating: 4.5,
    mainImage: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2',
    additionalImages: [],
    description: 'A beautifully hand-carved wooden chair.'
  },
  {
    id: 2,
    name: 'Block Print Scarf',
    sku: 'SCARF-002',
    brand: 'BlockPrints',
    category: 'Textiles',
    price: 1500,
    discount: 0,
    stock: 50,
    status: 'Inactive',
    rating: 4.0,
    mainImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    additionalImages: [],
    description: 'Traditional block print scarf with vibrant colors.'
  }
];

const ListingDashboard = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [form, setForm] = useState<{
    name: string;
    sku: string;
    brand: string;
    category: string;
    price: string;
    discount: string;
    stock: string;
    status: 'Active' | 'Inactive';
    rating: string;
    mainImage: string;
    additionalImages: string[];
    description: string;
  }>({
    name: '',
    sku: '',
    brand: '',
    category: '',
    price: '',
    discount: '',
    stock: '',
    status: 'Active',
    rating: '',
    mainImage: '',
    additionalImages: [],
    description: ''
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Get unique categories for filter dropdown
  const categories = Array.from(new Set(products.map(p => p.category)));

  // Handle main image upload
  const handleMainImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setForm(f => ({ ...f, mainImage: url }));
    }
  };

  // Handle additional images upload (max 5)
  const handleAdditionalImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      let urls = Array.from(files).map(file => URL.createObjectURL(file));
      if (urls.length > 5) {
        alert('You can upload a maximum of 5 additional images.');
        urls = urls.slice(0, 5);
      }
      setForm(f => ({ ...f, additionalImages: urls }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.price || !form.sku || !form.brand || !form.stock) return;
    if (!form.mainImage) return alert('Please upload a main image.');
    if (editId !== null) {
      setProducts(products.map(p =>
        p.id === editId
          ? {
              ...p,
              ...form,
              id: editId,
              price: Number(form.price),
              discount: Number(form.discount) || 0,
              stock: Number(form.stock),
              rating: Number(form.rating) || 0,
              mainImage: form.mainImage,
              additionalImages: form.additionalImages,
              status: form.status
            }
          : p
      ));
      setEditId(null);
    } else {
      setProducts([
        ...products,
        {
          ...form,
          id: Date.now(),
          price: Number(form.price),
          discount: Number(form.discount) || 0,
          stock: Number(form.stock),
          rating: Number(form.rating) || 0,
          mainImage: form.mainImage,
          additionalImages: form.additionalImages,
          status: form.status
        }
      ]);
    }
    setForm({ name: '', sku: '', brand: '', category: '', price: '', discount: '', stock: '', status: 'Active', rating: '', mainImage: '', additionalImages: [], description: '' });
  };

  const handleEdit = (id: number) => {
    const prod = products.find(p => p.id === id);
    if (prod) {
      setForm({
        name: prod.name,
        sku: prod.sku,
        brand: prod.brand,
        category: prod.category,
        price: prod.price.toString(),
        discount: prod.discount.toString(),
        stock: prod.stock.toString(),
        status: prod.status,
        rating: prod.rating.toString(),
        mainImage: prod.mainImage || '',
        additionalImages: prod.additionalImages || [],
        description: prod.description
      });
      setEditId(id);
    }
  };

  const handleDelete = (id: number) => {
    setProducts(products.filter(p => p.id !== id));
    if (editId === id) {
      setEditId(null);
      setForm({ name: '', sku: '', brand: '', category: '', price: '', discount: '', stock: '', status: 'Active', rating: '', mainImage: '', additionalImages: [], description: '' });
    }
  };

  // Filtered products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) || product.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter ? product.category === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-extrabold text-orange-700 mb-10 tracking-tight drop-shadow">Product Listings Dashboard</h1>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex gap-2 items-center">
            <span className="font-semibold text-blue-900 text-lg">Total Products:</span>
            <span className="bg-orange-100 text-orange-700 px-4 py-1 rounded-full font-bold text-lg shadow-inner">{products.length}</span>
          </div>
          <div className="flex gap-2 items-center">
            <input
              className="border-2 border-blue-200 rounded-lg p-2 w-56 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              placeholder="Search by name or category"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="border-2 border-blue-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="bg-white/80 rounded-3xl shadow-2xl p-8 mb-10 border border-orange-100">
          <h2 className="text-2xl font-bold text-blue-800 mb-6">{editId ? 'Edit Product' : 'Add New Product'}</h2>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
            <input className="border-2 border-blue-200 rounded-lg p-3 text-lg" name="name" value={form.name} onChange={handleChange} placeholder="Product Name" />
            <input className="border-2 border-blue-200 rounded-lg p-3 text-lg" name="category" value={form.category} onChange={handleChange} placeholder="Category" />
            <input className="border-2 border-blue-200 rounded-lg p-3 text-lg" name="price" value={form.price} onChange={handleChange} placeholder="Price" type="number" min="0" />
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="font-medium text-blue-900">Main Image</label>
              <input type="file" accept="image/*" onChange={handleMainImage} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              {form.mainImage && (
                <img src={form.mainImage} alt="Main Preview" className="w-28 h-28 object-cover rounded-xl border-2 border-blue-200 shadow mt-2" />
              )}
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="font-medium text-blue-900">Additional Images</label>
              <input type="file" accept="image/*" multiple onChange={handleAdditionalImages} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100" max={5} />
              {form.additionalImages.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {form.additionalImages.slice(0, 5).map((img, i) => (
                    <img key={i} src={img} alt={`Additional ${i+1}`} className="w-16 h-16 object-cover rounded-lg border-2 border-orange-200 shadow" />
                  ))}
                  {form.additionalImages.length > 5 && (
                    <span className="text-xs text-red-500 ml-2">Only 5 images allowed.</span>
                  )}
                </div>
              )}
            </div>
            <textarea className="border-2 border-blue-200 rounded-lg p-3 text-lg md:col-span-2" name="description" value={form.description} onChange={handleChange} placeholder="Description" />
            <div className="md:col-span-2 flex gap-3 mt-2">
              <button type="submit" className="bg-gradient-to-r from-blue-600 to-blue-400 text-white px-6 py-2 rounded-xl font-semibold shadow hover:from-blue-700 hover:to-blue-500 transition">
                {editId ? 'Update Product' : 'Add Product'}
              </button>
              {editId && (
                <button type="button" className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl font-semibold shadow hover:bg-gray-300 transition" onClick={() => { setEditId(null); setForm({ name: '', sku: '', brand: '', category: '', price: '', discount: '', stock: '', status: 'Active', rating: '', mainImage: '', additionalImages: [], description: '' }); }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
        <div className="bg-white/90 rounded-3xl shadow-xl p-8 border border-blue-100">
          <h2 className="text-2xl font-bold text-blue-800 mb-6">All Products</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left divide-y divide-blue-100">
              <thead className="bg-blue-50">
                <tr>
                  <th className="py-3 px-4 font-semibold text-blue-900">Main Image</th>
                  <th className="py-3 px-4 font-semibold text-blue-900">Name</th>
                  <th className="py-3 px-4 font-semibold text-blue-900">Category</th>
                  <th className="py-3 px-4 font-semibold text-blue-900">Price</th>
                  <th className="py-3 px-4 font-semibold text-blue-900">Additional Images</th>
                  <th className="py-3 px-4 font-semibold text-blue-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-6 text-gray-400">No products found.</td></tr>
                ) : (
                  filteredProducts.map(product => (
                    <tr className="border-t hover:bg-blue-50 transition group" key={product.id}>
                      <td className="py-3 px-4">
                        {product.mainImage ? <img src={product.mainImage} alt={product.name} className="w-16 h-16 object-cover rounded-xl border-2 border-blue-200 shadow group-hover:scale-105 transition-transform" /> : <span className="text-gray-400">No Image</span>}
                      </td>
                      <td className="py-3 px-4 font-semibold text-blue-900">{product.name}</td>
                      <td className="py-3 px-4">{product.category}</td>
                      <td className="py-3 px-4">₹{product.price.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1 flex-wrap">
                          {product.additionalImages.length > 0 ? (
                            product.additionalImages.slice(0, 5).map((img: string, i: number) => (
                              <img key={i} src={img} alt={`Additional ${i+1}`} className="w-10 h-10 object-cover rounded border-2 border-orange-200 shadow group-hover:scale-110 transition-transform" />
                            ))
                          ) : <span className="text-gray-400">None</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-blue-600 hover:underline mr-2 font-semibold" onClick={() => handleEdit(product.id)}>Edit</button>
                        <button className="text-red-500 hover:underline font-semibold" onClick={() => handleDelete(product.id)}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDashboard;
