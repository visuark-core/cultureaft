import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Link, useLocation } from 'react-router-dom';

// This is the updated list of links, with "Admin Dashboard" removed.
const links = [
  { to: "/admin/products", label: "Product Listings" },
  { to: "/admin/inventory", label: "Inventory" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/blog-management", label: "Blog Management" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/reports", label: "Reports" },
  { to: "/admin/profile", label: "Profile" },
];

const Sidebar = () => {

  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  return (
    <aside className="w-64 bg-white/90 border-r border-blue-100 min-h-screen p-6 flex flex-col gap-4 shadow-xl">
      <h2 className="text-2xl font-bold text-blue-800 mb-6">Admin Panel</h2>
      <nav className="flex flex-col gap-2">
        {links.map(link => {
          if (link.label === 'Profile') {
            const isActive = location.pathname.startsWith(link.to);
            return (
              <div key={link.to} className="relative" ref={profileRef}>
                <button
                  type="button"
                  className={`w-full text-left rounded px-3 py-2 font-medium transition duration-150 flex items-center justify-between hover:bg-blue-100 hover:text-blue-900 ${isActive ? 'bg-blue-200 text-blue-900 font-bold shadow' : 'text-blue-800'}`}
                  onClick={() => setProfileOpen((open) => !open)}
                >
                  {link.label}
                  <span className="ml-2 material-icons text-base"></span>
                </button>
                {profileOpen && (
                  <div
                    className="absolute left-0 top-full mt-2 w-56 bg-white border border-blue-100 rounded-lg shadow-lg z-50 p-4 flex flex-col gap-2"
                  >
                    <div className="mb-2">
                      <div className="font-bold text-blue-900">{user.name}</div>
                      <div className="text-xs text-blue-700">{user.email}</div>
                    </div>
                    <Link to="/dashboard" className="rounded px-3 py-2 text-blue-800 hover:bg-blue-100 hover:text-blue-900 font-medium">Dashboard</Link>
                    <Link to="/admin" className="rounded px-3 py-2 text-blue-800 hover:bg-blue-100 hover:text-blue-900 font-medium">AdminDashboard</Link>
                    <button
                      className="rounded px-3 py-2 text-red-700 hover:bg-red-100 hover:text-red-900 font-medium text-left"
                      onClick={() => {
                        logout();
                        navigate('/login');
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            );
          }
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