import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const links = [
  { to: "/admin/products", label: "Product Listings" },
  { to: "/admin/inventory", label: "Inventory" },
  // Removed SEO and Compliance links
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/blog-management", label: "Blog Management" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/reports", label: "Reports" },
];

const Sidebar = () => {
  const location = useLocation();
  return (
    <aside className="w-64 bg-white/90 border-r border-blue-100 min-h-screen p-6 flex flex-col gap-4 shadow-xl">
      <h2 className="text-2xl font-bold text-blue-800 mb-6">Admin Panel</h2>
      <nav className="flex flex-col gap-2">
        {links.map(link => {
          const isActive = location.pathname.startsWith(link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded px-3 py-2 font-medium transition duration-150
                hover:bg-blue-100 hover:text-blue-900
                ${isActive ? 'bg-blue-200 text-blue-900 font-bold shadow' : 'text-blue-800'}`}
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