import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export interface Customer {
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  registrationDate: string;
  addresses: Address[];
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  preferences: {
    newsletter: boolean;
    orderUpdates: boolean;
    promotions: boolean;
  };
  status: 'active' | 'inactive' | 'blocked';
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  type: 'home' | 'work' | 'other';
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  sku: string;
  description: string;
  shortDescription?: string;
  craftsman?: string;
  image: string;
  images: string[];
  materials: string[];
  dimensions?: string;
  weight?: string;
  origin?: string;
  rating: number;
  reviewCount: number;
  isNew: boolean;
  isFeatured: boolean;
  isActive: boolean;
  stock: number;
  minQuantity: number;
  maxQuantity: number;
  tags: string[];
  hsn?: string;
  taxRate: number;
  careInstructions: string[];
  warranty?: string;
  shippingWeight?: number;
  shippingDimensions?: {
    length: number;
    width: number;
    height: number;
  };
  metaTitle?: string;
  metaDescription?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderId: string;
  customerId: string;
  customer: {
    name?: string;
    email?: string;
    phone?: string;
  };
  items: OrderItem[];
  totalAmount: number;
  finalAmount: number;
  taxAmount: number;
  pricing: {
    subtotal: number;
    shippingCharges: number;
    codCharges: number;
    taxes: number;
    discount: number;
    total: number;
  };
  paymentMethod: string;
  paymentStatus: string;
  transactionId?: string;
  paymentDate?: string;
  payment: {
    method: string;
    status: string;
    paidAmount: number;
    paidAt?: string;
  };
  shippingAddress: Address;
  shipping: {
    address: Address;
    method: string;
    estimatedDelivery?: string;
    actualDelivery?: string;
    trackingNumber?: string;
    carrier?: string;
  };
  status: string;
  orderDate: string;
  timeline: TimelineEvent[];
  delivery: {
    assignedAgent?: string;
    deliveryStatus: string;
    estimatedDeliveryTime?: string;
    actualDeliveryTime?: string;
  };
  notes?: string;
  tags: string[];
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  category: string;
  subtotal: number;
  discount: number;
  tax: number;
}

export interface TimelineEvent {
  status: string;
  timestamp: string;
  updatedBy?: string;
  notes?: string;
  automated: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  role: {
    name: string;
    level: number;
    permissions: Permission[];
    canCreateSubAdmins: boolean;
    description: string;
  };
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    phone?: string;
  };
  security: {
    lastLogin?: string;
    mfaEnabled: boolean;
    loginAttempts: number;
  };
  audit: {
    createdBy?: string;
    createdAt: string;
    updatedAt: string;
    lastActivity?: string;
  };
  isActive: boolean;
}

export interface Permission {
  resource: string;
  actions: string[];
  conditions?: any[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  count?: number;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface AnalyticsData {
  orders: any[];
  revenue: any[];
  customers: {
    total: number;
    active: number;
    inactive: number;
    blocked: number;
    totalSpent: number;
    averageOrderValue: number;
  };
  products: {
    total: number;
    active: number;
    inactive: number;
    featured: number;
    outOfStock: number;
    lowStock: number;
    categories: Record<string, number>;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface DataSourceStatus {
  primaryDataSource: string;
  fallbackEnabled: boolean;
  googleSheetsEnabled: boolean;
  mongoDbAvailable: boolean;
  spreadsheetId: string | null;
}

class DataService {
  // Customer methods
  async getAllCustomers(): Promise<ApiResponse<Customer[]>> {
    const response = await api.get('/data/customers');
    return response.data;
  }

  async getCustomerById(id: string): Promise<ApiResponse<Customer>> {
    const response = await api.get(`/data/customers/${id}`);
    return response.data;
  }

  async createCustomer(customerData: Partial<Customer>): Promise<ApiResponse<Customer>> {
    const response = await api.post('/data/customers', customerData);
    return response.data;
  }

  async updateCustomer(id: string, customerData: Partial<Customer>): Promise<ApiResponse<Customer>> {
    const response = await api.put(`/data/customers/${id}`, customerData);
    return response.data;
  }

  // Product methods
  async getAllProducts(params?: {
    active?: boolean;
    featured?: boolean;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Product[]>> {
    const response = await api.get('/data/products', { params });
    return response.data;
  }

  async getProductById(id: string): Promise<ApiResponse<Product>> {
    const response = await api.get(`/data/products/${id}`);
    return response.data;
  }

  async createProduct(productData: Partial<Product>): Promise<ApiResponse<Product>> {
    const response = await api.post('/data/products', productData);
    return response.data;
  }

  async updateProduct(id: string, productData: Partial<Product>): Promise<ApiResponse<Product>> {
    const response = await api.put(`/data/products/${id}`, productData);
    return response.data;
  }

  // Order methods
  async getAllOrders(params?: {
    status?: string;
    customerId?: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<Order[]>> {
    const response = await api.get('/data/orders', { params });
    return response.data;
  }

  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    const response = await api.get(`/data/orders/${id}`);
    return response.data;
  }

  async createOrder(orderData: Partial<Order>): Promise<ApiResponse<Order>> {
    const response = await api.post('/data/orders', orderData);
    return response.data;
  }

  async updateOrder(id: string, orderData: Partial<Order>): Promise<ApiResponse<Order>> {
    const response = await api.put(`/data/orders/${id}`, orderData);
    return response.data;
  }

  // Admin user methods
  async getAllAdminUsers(): Promise<ApiResponse<AdminUser[]>> {
    const response = await api.get('/data/admin-users');
    return response.data;
  }

  // Analytics methods
  async getAnalytics(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<AnalyticsData>> {
    const response = await api.get('/data/analytics', { params });
    return response.data;
  }

  // Data source status
  async getDataSourceStatus(): Promise<ApiResponse<DataSourceStatus>> {
    const response = await api.get('/data/status');
    return response.data;
  }

  // Search methods
  async searchProducts(query: string): Promise<ApiResponse<Product[]>> {
    const response = await api.get('/data/products', { 
      params: { search: query, active: true } 
    });
    return response.data;
  }

  async searchCustomers(query: string): Promise<ApiResponse<Customer[]>> {
    const response = await api.get('/data/customers', { 
      params: { search: query } 
    });
    return response.data;
  }

  async searchOrders(query: string): Promise<ApiResponse<Order[]>> {
    const response = await api.get('/data/orders', { 
      params: { search: query } 
    });
    return response.data;
  }
}

export default new DataService();