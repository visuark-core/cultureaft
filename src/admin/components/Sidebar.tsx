import React from 'react';
import { Link, useLocation } from 'react-router-dom';


const links = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/products", label: "Product Listings" },
  { to: "/admin/inventory", label: "Inventory" },
  { to: "/admin/pricing", label: "Pricing" },
  { to: "/admin/seo", label: "SEO" },
  { to: "/admin/compliance", label: "Compliance" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/reports", label: "Reports" },
];

const Sidebar = () => {
  const location = useLocation();
  return (
    <aside className="w-64 bg-white/90 border-r border-blue-100 min-h-screen p-6 flex flex-col gap-4 shadow-xl">
      <h2 className="text-2xl font-bold text-blue-800 mb-6">Admin</h2>
      <nav className="flex flex-col gap-2">
        {links.map(link => {
          const isActive = location.pathname.startsWith(link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded px-3 py-2 font-medium transition duration-150
                hover:bg-blue-100 hover:text-blue-900
                ${isActive ? (link.logout ? 'bg-red-100 text-red-700 font-bold' : 'bg-blue-200 text-blue-900 font-bold shadow') : (link.logout ? 'text-red-600' : 'text-blue-800')}`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
