import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ShoppingCart, Users, ArrowUp, ArrowDown } from 'lucide-react';

// --- MOCK DATA ---
const salesData = [
  { name: 'Day 1', Sales: 4000 },
  { name: 'Day 5', Sales: 3000 },
  { name: 'Day 10', Sales: 2000 },
  { name: 'Day 15', Sales: 2780 },
  { name: 'Day 20', Sales: 1890 },
  { name: 'Day 25', Sales: 2390 },
  { name: 'Day 30', Sales: 3490 },
];

const categoryData = [
  { name: 'Furniture', value: 400 },
  { name: 'Decor', value: 300 },
  { name: 'Textiles', value: 300 },
  { name: 'Accessories', value: 200 },
];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const topProducts = [
    { name: 'Royal Carved Throne Chair', sku: 'SKU-001', unitsSold: 120, revenue: '₹5,40,000' },
    { name: 'Ornate Storage Cabinet', sku: 'SKU-002', unitsSold: 98, revenue: '₹3,13,600' },
    { name: 'Wooden Coffee Table', sku: 'SKU-004', unitsSold: 85, revenue: '₹1,53,000' },
    { name: 'Decorative Mirror Frame', sku: 'SKU-003', unitsSold: 72, revenue: '₹6,12,000' },
];

const kpis = [
    { title: 'Total Revenue', value: '₹1,250,000', change: '+12.5%', changeType: 'increase', icon: <DollarSign/>, color: 'text-green-600' },
    { title: 'Total Sales', value: '489', change: '+8.2%', changeType: 'increase', icon: <ShoppingCart/>, color: 'text-green-600' },
    { title: 'New Customers', value: '64', change: '-2.1%', changeType: 'decrease', icon: <Users/>, color: 'text-red-600' },
    { title: 'Avg. Order Value', value: '₹2,556', change: '+3.5%', changeType: 'increase', icon: <DollarSign/>, color: 'text-green-600' },
];

const KPI_Card = ({ title, value, change, changeType, icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 font-medium">{title}</h3>
            <div className="text-blue-600">{icon}</div>
        </div>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
        <div className="flex items-center mt-2 text-sm">
            <span className={`flex items-center font-semibold ${color}`}>
                {changeType === 'increase' ? <ArrowUp size={16} className="mr-1"/> : <ArrowDown size={16} className="mr-1"/>}
                {change}
            </span>
            <span className="text-gray-500 ml-2">vs. last month</span>
        </div>
    </div>
);

const Analytics = () => {
  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map(kpi => <KPI_Card key={kpi.title} {...kpi} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Sales Overview (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Sales" stroke="#0088FE" strokeWidth={2} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Category Distribution Chart */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Top Products Table */}
      <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Top Selling Products</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-4 font-semibold">Product Name</th>
                <th className="p-4 font-semibold">SKU</th>
                <th className="p-4 font-semibold">Units Sold</th>
                <th className="p-4 font-semibold">Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map(product => (
                <tr key={product.sku} className="border-b hover:bg-gray-50">
                  <td className="p-4">{product.name}</td>
                  <td className="p-4 text-gray-600">{product.sku}</td>
                  <td className="p-4 font-medium">{product.unitsSold}</td>
                  <td className="p-4 font-medium">{product.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;