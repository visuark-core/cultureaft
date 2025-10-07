import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { 
  Package, 
  Package2, 
  ShoppingCart, 
  Tags, 
  FileText, 
  BarChart3, 
  FileBarChart, 
  User, 
  LogOut, 
  ChevronDown, 
  ChevronRight,
  Shield,
  Clock,
  Settings,
  Archive,
  Activity,
  Database,
  AlertTriangle
} from 'lucide-react';

interface NavigationItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  permission?: string;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  { 
    to: "/admin/products", 
    label: "Product Listings", 
    icon: <Package className="h-5 w-5" />,
    permission: "products.read"
  },
  { 
    to: "/admin/inventory", 
    label: "Inventory",
    icon: <Archive className="h-5 w-5" />,
    permission: "inventory.read"
  },
  { 
    to: "/admin/orders", 
    label: "Orders", 
    icon: <ShoppingCart className="h-5 w-5" />,
    permission: "orders.read"
  },
  { 
    to: "/admin/customers", 
    label: "Customers", 
    icon: <User className="h-5 w-5" />,
    permission: "users.read"
  },
  { 
    to: "/admin/categories", 
    label: "Categories", 
    icon: <Tags className="h-5 w-5" />,
    permission: "categories.read"
  },
  { 
    to: "/admin/blog-management", 
    label: "Blog Management", 
    icon: <FileText className="h-5 w-5" />,
    permission: "content.read"
  },
  { 
    to: "/admin/analytics", 
    label: "Analytics", 
    icon: <BarChart3 className="h-5 w-5" />,
    permission: "analytics.read"
  },
  { 
    to: "/admin/reports", 
    label: "Reports", 
    icon: <FileBarChart className="h-5 w-5" />,
    permission: "reports.read"
  },
  {
    to: "/admin/system",
    label: "System Administration",
    icon: <Settings className="h-5 w-5" />,
    permission: "system.read",
    children: [
      {
        to: "/admin/system/settings",
        label: "System Settings",
        icon: <Settings className="h-4 w-4" />,
        permission: "system.read"
      },
      {
        to: "/admin/system/monitoring",
        label: "System Monitoring",
        icon: <Activity className="h-4 w-4" />,
        permission: "system.read"
      },
      {
        to: "/admin/system/audit",
        label: "Audit Logs",
        icon: <Shield className="h-4 w-4" />,
        permission: "system.read"
      }
    ]
  },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout, hasPermission, sessionExpiry } = useAdminAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  useEffect(() => {
    const currentPath = location.pathname;
    for (const item of navigationItems) {
      if (item.children) {
        for (const child of item.children) {
          if (currentPath.startsWith(child.to)) {
            setExpandedItems(prev => [...new Set([...prev, item.to])]);
            return;
          }
        }
      }
    }
  }, [location.pathname]);

  const toggleExpanded = (itemTo: string) => {
    setExpandedItems(prev =>
      prev.includes(itemTo)
        ? prev.filter(item => item !== itemTo)
        : [...prev, itemTo]
    );
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/admin/login');
    }
  };

  const formatTimeRemaining = () => {
    if (!sessionExpiry) return '';
    const now = new Date();
    const diff = sessionExpiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const isSessionValid = () => {
    if (!sessionExpiry) return false;
    return new Date() < sessionExpiry;
  };

  const renderNavigationItem = (item: NavigationItem, depth = 0) => {
    if (item.permission && !hasPermission(item.permission)) return null;

    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.to);
    
    const isActive = hasChildren
      ? location.pathname.startsWith(item.to) && isExpanded
      : location.pathname === item.to;

    return (
      <div key={item.to}>
        <div className="flex items-center">
          <Link
            to={item.to}
            className={`flex-1 flex items-center space-x-3 rounded-lg px-3 py-2 font-medium transition-all duration-200 ${
              isActive
                ? 'active-link'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            } ${depth > 0 ? 'ml-4' : ''}`}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
          >
            {item.icon}
            <span className="truncate">{item.label}</span>
          </Link>
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(item.to)}
              className="p-1 rounded hover:bg-gray-100"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderNavigationItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
            <p className="text-xs text-gray-500">CultureAft</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {admin?.profile.firstName} {admin?.profile.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">{admin?.email}</p>
            <p className="text-xs text-blue-600 font-medium">{admin?.role.name}</p>
          </div>
        </div>
        
        {/* Session Status */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-500">Session: {formatTimeRemaining()}</span>
          </div>
          <div className={`h-2 w-2 rounded-full ${isSessionValid() ? 'bg-green-400' : 'bg-red-400'}`} />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigationItems.map(item => renderNavigationItem(item))}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <Link
          to="/admin/profile"
          className="flex items-center space-x-3 w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Settings className="h-4 w-4" />
          <span>Profile Settings</span>
        </Link>
        
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;