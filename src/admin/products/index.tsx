
import React, { useEffect, useState } from 'react';
import AdminHeader from '../AdminHeader';

interface Product {
	_id?: string;
	name: string;
	description: string;
	price: number;
	image?: string;
	category?: string;
	stock?: number;
}

const AdminProducts: React.FC = () => {
	const [products, setProducts] = useState<Product[]>([]);
	const [form, setForm] = useState<Product>({ name: '', description: '', price: 0, image: '', category: '', stock: 0 });
	const [showForm, setShowForm] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	// Fetch products
	useEffect(() => {
		fetchProducts();
	}, []);

	const fetchProducts = async () => {
		setLoading(true);
		try {
			const res = await fetch('http://localhost:3000/api/products');
			const data = await res.json();
			setProducts(data);
		} catch (err) {
			setError('Failed to fetch products');
		} finally {
			setLoading(false);
		}
	};

	const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setForm(prev => ({ ...prev, [name]: name === 'price' || name === 'stock' ? Number(value) : value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		try {
			const res = await fetch('http://localhost:3000/api/products', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form)
			});
			if (!res.ok) throw new Error('Failed to add product');
			const newProduct = await res.json();
			setProducts(prev => [newProduct, ...prev]);
			setShowForm(false);
			setForm({ name: '', description: '', price: 0, image: '', category: '', stock: 0 });
		} catch (err: any) {
			setError(err.message || 'Error');
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<AdminHeader />
			<div style={{ padding: '2rem' }}>
				<h2 className="text-2xl font-bold mb-4">Admin Products Dashboard</h2>
				<button
					className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
					onClick={() => setShowForm(true)}
				>
					Add Product
				</button>
				{showForm && (
					<form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6 max-w-xl">
						<div className="mb-2">
							<input name="name" value={form.name} onChange={handleInput} placeholder="Name" className="border p-2 w-full" required />
						</div>
						<div className="mb-2">
							<textarea name="description" value={form.description} onChange={handleInput} placeholder="Description" className="border p-2 w-full" />
						</div>
						<div className="mb-2">
							<input name="price" type="number" value={form.price} onChange={handleInput} placeholder="Price" className="border p-2 w-full" required />
						</div>
						<div className="mb-2">
							<input name="image" value={form.image} onChange={handleInput} placeholder="Image URL" className="border p-2 w-full" />
						</div>
						<div className="mb-2">
							<input name="category" value={form.category} onChange={handleInput} placeholder="Category" className="border p-2 w-full" />
						</div>
						<div className="mb-2">
							<input name="stock" type="number" value={form.stock} onChange={handleInput} placeholder="Stock" className="border p-2 w-full" />
						</div>
						<div className="flex gap-2">
							<button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save</button>
							<button type="button" className="bg-gray-200 px-4 py-2 rounded" onClick={() => setShowForm(false)}>Cancel</button>
						</div>
					</form>
				)}
				{loading && <div>Loading...</div>}
				{error && <div className="text-red-600">{error}</div>}
				<table className="w-full bg-white rounded shadow">
					<thead>
						<tr>
							<th className="p-2">Name</th>
							<th className="p-2">Description</th>
							<th className="p-2">Price</th>
							<th className="p-2">Category</th>
							<th className="p-2">Stock</th>
							<th className="p-2">Image</th>
						</tr>
					</thead>
					<tbody>
						{products.map(product => (
							<tr key={product._id} className="border-t">
								<td className="p-2">{product.name}</td>
								<td className="p-2">{product.description}</td>
								<td className="p-2">₹{product.price}</td>
								<td className="p-2">{product.category}</td>
								<td className="p-2">{product.stock}</td>
								<td className="p-2">{product.image && <img src={product.image} alt={product.name} className="h-12 w-12 object-cover rounded" />}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</>
	);
};

export default AdminProducts;
