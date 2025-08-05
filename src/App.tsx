import MediaFormFields from './admin/MediaFormFields';
import ComplianceFormFields from './admin/ComplianceFormFields';
import OrdersFormFields from './admin/OrdersFormFields';
import CategoriesFormFields from './admin/CategoriesFormFields';
import CustomersFormFields from './admin/CustomersFormFields';
import SeoFormFields from './admin/SeoFormFields';
import PricingFormFields from './admin/PricingFormFields';
import InventoryFormFields from './admin/InventoryFormFields';
import ProductFormFields from './admin/ProductFormFields';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/Footer';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Heritage from './pages/Heritage';
import About from './pages/About';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import ListingDashboard from './admin/ListingDashboard';
import Dashboard from './admin/Dashboard';
import Sidebar from './admin/components/Sidebar';
import { CartProvider } from './context/CartContext';

type SidebarWrapperProps = {
  title: string;
  children?: React.ReactNode;
};
const SidebarWrapper = ({ title, children }: SidebarWrapperProps) => {
  return (
    <div className="flex min-h-screen">
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

function App() {
  return (
    <CartProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:category" element={<Products />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/heritage" element={<Heritage />} />
              <Route path="/about" element={<About />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/listingdashboard" element={<ListingDashboard />} />
              <Route path="/admin/products" element={<SidebarWrapper title="Product Listings"><ProductFormFields /></SidebarWrapper>} />
              <Route path="/admin/inventory" element={<SidebarWrapper title="Inventory"><InventoryFormFields /></SidebarWrapper>} />
              <Route path="/admin/pricing" element={<SidebarWrapper title="Pricing"><PricingFormFields /></SidebarWrapper>} />
              <Route path="/admin/media" element={<SidebarWrapper title="Media"><MediaFormFields /></SidebarWrapper>} />
              <Route path="/admin/seo" element={<SidebarWrapper title="SEO"><SeoFormFields /></SidebarWrapper>} />
              <Route path="/admin/compliance" element={<SidebarWrapper title="Compliance"><ComplianceFormFields /></SidebarWrapper>} />
              <Route path="/admin/orders" element={<SidebarWrapper title="Orders"><OrdersFormFields /></SidebarWrapper>} />
              <Route path="/admin/customers" element={<SidebarWrapper title="Customers"><CustomersFormFields /></SidebarWrapper>} />
              <Route path="/admin/categories" element={<SidebarWrapper title="Categories"><CategoriesFormFields /></SidebarWrapper>} />
              <Route path="/admin/analytics" element={<SidebarWrapper title="Analytics" />} />
              <Route path="/admin/reports" element={<SidebarWrapper title="Reports" />} />
              <Route path="/admin/settings" element={<SidebarWrapper title="Settings" />} />
              <Route path="/admin/bulk-upload" element={<SidebarWrapper title="Bulk Upload" />} />
              <Route path="/admin/ai-tools" element={<SidebarWrapper title="AI Tools" />} />
              <Route path="/admin/support" element={<SidebarWrapper title="Support" />} />
              <Route path="/admin/logout" element={<SidebarWrapper title="Logout" />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;