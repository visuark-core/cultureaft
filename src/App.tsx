import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

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
import OrderSuccess from './pages/OrderSuccess';
import Login from './pages/Login';
import Signup from './pages/Signup';

// User Dashboard Imports
import UserDashboard from './pages/UserDashboard';
import UserOrders from './pages/UserOrders';
import UserWishlist from './pages/UserWishlist';
import UserProfile from './pages/UserProfile';

// Admin Panel Imports
import AdminLogin from './admin/AdminLogin';
import AdminLayout from './admin/AdminLayout';
import AdminProfile from './admin/AdminProfile';
import ProductFormFields from './admin/ProductFormFields';
import InventoryFormFields from './admin/InventoryFormFields';
import OrdersFormFields from './admin/OrdersFormFields';
import Customers from './admin/Customers';
import CategoriesFormFields from './admin/CategoriesFormFields';
import BlogManagement from './admin/BlogManagement';
import Analytics from './admin/Analytics';
import Reports from './admin/Reports';
import SystemSettings from './admin/SystemSettings';
import SystemMonitoring from './admin/SystemMonitoring';
import AuditLogs from './admin/AuditLogs';

// Component & Context Imports
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { CartProvider } from './context/CartContext';
import useHistory from './hooks/useHistory';
import Breadcrumbs from './components/Breadcrumbs';
import RouteGuard from './components/RouteGuard';

// --- Admin Layout Wrapper ---
type AdminWrapperProps = {
  title: string;
  children?: React.ReactNode;
};

const AdminWrapper = ({ title, children }: AdminWrapperProps) => {
  return (
    <AdminLayout title={title}>
      {children || (
        <div className="flex items-center justify-center h-full">
          <span className="text-xl text-gray-400">(Coming Soon)</span>
        </div>
      )}
    </AdminLayout>
  );
};

// --- Main App Layout ---
function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const hideHeaderFooter = location.pathname === '/login' || 
                           location.pathname === '/signup' || 
                           location.pathname.startsWith('/admin');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {!hideHeaderFooter && <Header />}
      <Breadcrumbs />
      <main>{children}</main>
      {!hideHeaderFooter && <Footer />}
    </div>
  );
}

// --- App Component with Routing ---
function App() {
  useHistory();
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <CartProvider>
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
              <Route path="/order-success" element={<OrderSuccess />} />

              {/* Protected User Routes */}
              <Route path="/dashboard" element={<RouteGuard roles={['user', 'admin']}><UserDashboard /></RouteGuard>} />
              <Route path="/user/orders" element={<RouteGuard roles={['user', 'admin']}><UserOrders /></RouteGuard>} />
              <Route path="/user/wishlist" element={<RouteGuard roles={['user', 'admin']}><UserWishlist /></RouteGuard>} />
              <Route path="/user/profile" element={<RouteGuard roles={['user', 'admin']}><UserProfile /></RouteGuard>} />

              {/* Admin Authentication */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Protected Admin Routes */}
              <Route path="/admin/profile" element={<ProtectedRoute requireAdmin><AdminWrapper title="Profile Settings"><AdminProfile /></AdminWrapper></ProtectedRoute>} />
              <Route path="/admin/products" element={<ProtectedRoute requireAdmin><AdminWrapper title="Product Listings"><ProductFormFields onSubmit={() => {}} onCancel={() => {}} /></AdminWrapper></ProtectedRoute>} />
              <Route path="/admin/inventory" element={<ProtectedRoute requireAdmin><AdminWrapper title="Inventory"><InventoryFormFields /></AdminWrapper></ProtectedRoute>} />
              <Route path="/admin/orders" element={<ProtectedRoute requireAdmin><AdminWrapper title="Orders"><OrdersFormFields /></AdminWrapper></ProtectedRoute>} />
              <Route path="/admin/customers" element={<ProtectedRoute requireAdmin><AdminWrapper title="User Management"><Customers /></AdminWrapper></ProtectedRoute>} />
              <Route path="/admin/categories" element={<ProtectedRoute requireAdmin><AdminWrapper title="Categories"><CategoriesFormFields /></AdminWrapper></ProtectedRoute>} />
              <Route path="/admin/analytics" element={<ProtectedRoute requireAdmin><AdminWrapper title="Analytics"><Analytics /></AdminWrapper></ProtectedRoute>} />
              <Route path="/admin/blog-management" element={<ProtectedRoute requireAdmin><AdminWrapper title="Blog Management"><BlogManagement /></AdminWrapper></ProtectedRoute>} />
              <Route path="/admin/reports" element={<ProtectedRoute requireAdmin><AdminWrapper title="Reports"><Reports /></AdminWrapper></ProtectedRoute>} />
              
              {/* System Administration Routes */}
              <Route path="/admin/system/settings" element={<ProtectedRoute requireAdmin><AdminWrapper title="System Settings"><SystemSettings /></AdminWrapper></ProtectedRoute>} />
              <Route path="/admin/system/monitoring" element={<ProtectedRoute requireAdmin><AdminWrapper title="System Monitoring"><SystemMonitoring /></AdminWrapper></ProtectedRoute>} />
              <Route path="/admin/system/audit" element={<ProtectedRoute requireAdmin><AdminWrapper title="Audit Logs"><AuditLogs /></AdminWrapper></ProtectedRoute>} />
              
              <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><AdminWrapper title="Settings" /></ProtectedRoute>} />
              <Route path="/admin/bulk-upload" element={<ProtectedRoute requireAdmin><AdminWrapper title="Bulk Upload" /></ProtectedRoute>} />
              <Route path="/admin/ai-tools" element={<ProtectedRoute requireAdmin><AdminWrapper title="AI Tools" /></ProtectedRoute>} />
              <Route path="/admin/support" element={<ProtectedRoute requireAdmin><AdminWrapper title="Support" /></ProtectedRoute>} />
            </Routes>
            </AppLayout>
        </CartProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;