import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Signup: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with backend API
    if (!form.name || !form.email || !form.password) {
      setError('All fields are required.');
      return;
    }
    setError('');
    alert('Signup successful (mock)!');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-blue-900 mb-6 text-center">Sign Up</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-semibold mb-1">Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button type="submit" className="w-full px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Sign Up</button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-600">
          Already have an account? <a href="/login" className="text-blue-600 hover:underline">Login</a>
        </div>
      </div>
    </div>
  );
};

export default Signup;
