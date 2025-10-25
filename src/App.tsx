import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';

// Global Components
import LoadingIndicator from './components/LoadingIndicator';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorNotification from './components/ErrorNotification';
import SecurityMonitor from './components/SecurityMonitor';

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
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CustomerSupport from './pages/CustomerSupport';

// User Dashboard Imports
import UserDashboard from './pages/UserDashboard';
import UserOrders from './pages/UserOrders';
import UserWishlist from './pages/UserWishlist';
import UserProfile from './pages/UserProfile';

// Admin Panel Imports
import ProductsPage from './admin/products';
import ProductFormFields from './admin/ProductFormFields';
import InventoryFormFields from './admin/InventoryFormFields';
import Orders from './admin/Orders';
import CustomersFormFields from './admin/CustomersFormFields';
import CategoriesFormFields from './admin/CategoriesFormFields';
import BlogManagement from './admin/BlogManagement';
import Analytics from './admin/Analytics';
import Reports from './admin/Reports';
import SupportManagement from './admin/SupportManagement';
import SystemMonitoring from './pages/SystemMonitoring';
import DeliveryAgents from './admin/DeliveryAgents';
import DeliveryAnalytics from './admin/DeliveryAnalytics';

// Component & Context Imports
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Sidebar from './admin/components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Services
import { performanceMonitoringService } from './services/performanceMonitoringService';
import { errorHandlingService } from './services/errorHandlingService';

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

// --- Navigation Guard Component ---
function NavigationGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Handle page state restoration on refresh
    const handlePageStateRestoration = () => {
      try {
        // Check if we're on a valid route
        const validRoutes = [
          '/', '/login', '/signup', '/forgot-password', '/reset-password', '/products/furniture', '/products/decor',
          '/heritage', '/about', '/blog', '/cart', '/checkout', '/order-success', '/support',
          '/dashboard', '/user/orders', '/user/wishlist', '/user/profile'
        ];

        const isValidRoute = validRoutes.includes(location.pathname) ||
          location.pathname.startsWith('/product/') ||
          location.pathname.startsWith('/blog/') ||
          location.pathname.startsWith('/admin/');

        // If we're on an invalid route or blank page, redirect to home
        if (!isValidRoute && location.pathname !== '/') {
          console.warn('Invalid route detected, redirecting to home:', location.pathname);
          navigate('/', { replace: true });
        }

        // Store current path for back button functionality
        sessionStorage.setItem('lastValidPath', location.pathname);
      } catch (error) {
        console.error('Error in navigation guard:', error);
        // Fallback to home page on error
        navigate('/', { replace: true });
      }
    };

    handlePageStateRestoration();
  }, [location.pathname, navigate]);

  // Handle browser back button to prevent blank pages
  useEffect(() => {
    const handlePopState = () => {
      try {
        const currentPath = window.location.pathname;
        const lastValidPath = sessionStorage.getItem('lastValidPath');

        // If we detect a potential blank page scenario, use last valid path
        if (!currentPath || currentPath === '' || currentPath === '/undefined') {
          const fallbackPath = lastValidPath || '/';
          navigate(fallbackPath, { replace: true });
        }
      } catch (error) {
        console.error('Error handling back button:', error);
        navigate('/', { replace: true });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  return <>{children}</>;
}

// --- Main App Layout ---
function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const hideHeaderFooter = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/forgot-password' || location.pathname === '/reset-password' || location.pathname.startsWith('/admin');

  return (
    <NavigationGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
        {!hideHeaderFooter && <Header />}
        <main>{children}</main>
        {!hideHeaderFooter && <Footer />}
        <LoadingIndicator />
        {/* <SecurityMonitor /> - DISABLED to prevent connection dialog spam */}
        <ErrorNotification />
      </div>
    </NavigationGuard>
  );
}

// --- Default Route Handler ---
function DefaultRouteHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    // Ensure we're on the homepage by default
    const currentPath = window.location.pathname;
    if (currentPath === '' || currentPath === '/' || !currentPath) {
      // We're already on home, no need to navigate
      return;
    }
  }, [navigate]);

  return <Home />;
}

// --- App Component with Routing ---
function App() {
  // Initialize services
  React.useEffect(() => {
    // Start performance monitoring
    performanceMonitoringService.startMonitoring();
    
    // Setup global error handling
    errorHandlingService.setupGlobalErrorHandling();
    
    // Cleanup on unmount
    return () => {
      performanceMonitoringService.stopMonitoring();
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <Router>
            <ScrollToTop />
            <AppLayout>
              <Routes>
                {/* Public Customer-Facing Routes */}
                <Route path="/" element={<DefaultRouteHandler />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
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
                <Route path="/support" element={<CustomerSupport />} />

                {/* Protected User Routes */}
                <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
                <Route path="/user/orders" element={<ProtectedRoute><UserOrders /></ProtectedRoute>} />
                <Route path="/user/wishlist" element={<ProtectedRoute><UserWishlist /></ProtectedRoute>} />
                <Route path="/user/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />

                {/* Protected Admin Routes */}
                <Route path="/admin/products" element={<ProtectedRoute requireAdmin><SidebarWrapper title="Product Management"><ProductsPage /></SidebarWrapper></ProtectedRoute>} />
                <Route path="/admin/inventory" element={<ProtectedRoute requireAdmin><SidebarWrapper title="Inventory"><InventoryFormFields /></SidebarWrapper></ProtectedRoute>} />
                <Route path="/admin/orders" element={<SidebarWrapper title="Orders"><Orders /></SidebarWrapper>} />
                <Route path="/order-confirmation/:orderId" element={<OrderSuccess />} />
                <Route path="/order/:orderId" element={<OrderSuccess />} />
                <Route path="/admin/delivery-agents" element={<ProtectedRoute requireAdmin><SidebarWrapper title="Delivery Agents"><DeliveryAgents /></SidebarWrapper></ProtectedRoute>} />
                <Route path="/admin/delivery-analytics" element={<ProtectedRoute requireAdmin><SidebarWrapper title="Delivery Analytics"><DeliveryAnalytics /></SidebarWrapper></ProtectedRoute>} />
                <Route path="/admin/customers" element={<ProtectedRoute requireAdmin><SidebarWrapper title="Customers"><CustomersFormFields /></SidebarWrapper></ProtectedRoute>} />
                <Route path="/admin/categories" element={<ProtectedRoute requireAdmin><SidebarWrapper title="Categories"><CategoriesFormFields /></SidebarWrapper></ProtectedRoute>} />
                <Route path="/admin/analytics" element={<ProtectedRoute requireAdmin><SidebarWrapper title="Analytics"><Analytics /></SidebarWrapper></ProtectedRoute>} />
                <Route path="/admin/blog-management" element={<ProtectedRoute requireAdmin><SidebarWrapper title="Blog Management"><BlogManagement /></SidebarWrapper></ProtectedRoute>} />
                <Route path="/admin/reports" element={<ProtectedRoute requireAdmin><SidebarWrapper title="Reports"><Reports /></SidebarWrapper></ProtectedRoute>} />
                <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><SidebarWrapper title="Settings" /></ProtectedRoute>} />
                <Route path="/admin/bulk-upload" element={<ProtectedRoute requireAdmin><SidebarWrapper title="Bulk Upload" /></ProtectedRoute>} />
                <Route path="/admin/ai-tools" element={<ProtectedRoute requireAdmin><SidebarWrapper title="AI Tools" /></ProtectedRoute>} />
                <Route path="/admin/support" element={<ProtectedRoute requireAdmin><SidebarWrapper title="Support Management"><SupportManagement /></SidebarWrapper></ProtectedRoute>} />
                <Route path="/admin/system-monitoring" element={<ProtectedRoute requireAdmin><SidebarWrapper title="System Monitoring"><SystemMonitoring /></SidebarWrapper></ProtectedRoute>} />
                <Route path="/admin/logout" element={<ProtectedRoute requireAdmin><SidebarWrapper title="Logout" /></ProtectedRoute>} />

                {/* Catch-all route - redirect to home for any unmatched routes */}
                <Route path="*" element={<Home />} />
              </Routes>
            </AppLayout>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;