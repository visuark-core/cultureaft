import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Page Imports
import Home from './pages/Home';
import Furniture from './pages/Furniture';
import Decore from './pages/Decore';
import ProductDetail from './pages/ProductDetail';
import Heritage from './pages/Heritage';
import About from './pages/About';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Signup from './pages/Signup';

// User Dashboard Imports
import UserDashboard from './pages/UserDashboard';
import UserOrders from './pages/UserOrders';
import UserWishlist from './pages/UserWishlist';
import UserProfile from './pages/UserProfile';

// Admin Panel Imports
import ProductFormFields from './admin/ProductFormFields';
import InventoryFormFields from './admin/InventoryFormFields';
import OrdersFormFields from './admin/OrdersFormFields';
import CustomersFormFields from './admin/CustomersFormFields';
import CategoriesFormFields from './admin/CategoriesFormFields';
import BlogManagement from './admin/BlogManagement';
import Analytics from './admin/Analytics';
import Reports from './admin/Reports';

// Component & Context Imports
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Sidebar from './admin/components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// --- Reusable Admin Layout Wrapper ---
type SidebarWrapperProps = {
  title: string;
  children?: React.ReactNode;
};

const SidebarWrapper = ({ title, children }: SidebarWrapperProps) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-8">{title}</h1>
        {children || (
          <div className="flex items-center justify-center h-full">
            <span className="text-xl text-gray-400">(Coming Soon)</span>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App Layout ---
function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  // Hide main header/footer on login, signup, AND all admin pages
  const hideHeaderFooter = location.pathname === '/login' || location.pathname === '/signup' || location.pathname.startsWith('/admin');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {!hideHeaderFooter && <Header />}
      <main>{children}</main>
      {!hideHeaderFooter && <Footer />}
    </div>
  );
}

// --- App Component with Routing ---
function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <ScrollToTop />
          <AppLayout>
            <Routes>
              {/* Public Customer-Facing Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/products/furniture" element={<Furniture />} />
              <Route path="/products/decor" element={<Decore />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/heritage" element={<Heritage />} />
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:id" element={<BlogDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />

              {/* Protected User Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
              <Route path="/user/orders" element={<ProtectedRoute><UserOrders /></ProtectedRoute>} />
              <Route path="/user/wishlist" element={<ProtectedRoute><UserWishlist /></ProtectedRoute>} />
              <Route path="/user/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />

              {/* Protected Admin Routes */}
              <Route path="/admin/products" element={<ProtectedRoute requireAdmin><SidebarWrapper title="Product Listings"><ProductFormFields /></SidebarWrapper></ProtectedRoute>} />
              <Route path="/admin/inventory" element={<ProtectedRoute requireAdmin><SidebarWrapper title="Inventory"><InventoryFormFields /></SidebarWrapper></ProtectedRoute>} />
              <Route path="/admin/orders" element={<ProtectedRoute requireAdmin><SidebarWrapper title="Orders"><OrdersFormFields /></SidebarWrapper></ProtectedRoute>} />
              <Route path="/admin/customers" element={<ProtectedRoute requireAdmin><SidebarWrapper title="Customers"><CustomersFormFields /></SidebarWrapper></ProtectedRoute>} />
              <Route path="/admin/categories" element={<ProtectedRoute requireAdmin><SidebarWrapper title="Categories"><CategoriesFormFields /></SidebarWrapper></ProtectedRoute>} />
              <Route path="/admin/analytics" element={<ProtectedRoute requireAdmin><SidebarWrapper title="Analytics"><Analytics /></SidebarWrapper></ProtectedRoute>} />
              <Route path="/admin/blog-management" element={<ProtectedRoute requireAdmin><SidebarWrapper title="Blog Management"><BlogManagement /></SidebarWrapper></ProtectedRoute>} />
              <Route path="/admin/reports" element={<ProtectedRoute requireAdmin><SidebarWrapper title="Reports"><Reports /></SidebarWrapper></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><SidebarWrapper title="Settings" /></ProtectedRoute>} />
              <Route path="/admin/bulk-upload" element={<ProtectedRoute requireAdmin><SidebarWrapper title="Bulk Upload" /></ProtectedRoute>} />
              <Route path="/admin/ai-tools" element={<ProtectedRoute requireAdmin><SidebarWrapper title="AI Tools" /></ProtectedRoute>} />
              <Route path="/admin/support" element={<ProtectedRoute requireAdmin><SidebarWrapper title="Support" /></ProtectedRoute>} />
              <Route path="/admin/logout" element={<ProtectedRoute requireAdmin><SidebarWrapper title="Logout" /></ProtectedRoute>} />
            </Routes>
          </AppLayout>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;