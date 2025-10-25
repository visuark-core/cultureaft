
export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  landmark?: string;
  addressType?: 'home' | 'work' | 'other';
}

export interface ProductDetails {
  _id: string;
  name: string;
  image?: string;
  sku: string;
  description?: string;
  price: number;
}

export interface OrderItem {
  productId: ProductDetails; // Populated product details
  name: string;
  sku: string;
  quantity: number;
  price: number;
  category: string;
  variant?: {
    size?: string;
    color?: string;
    material?: string;
    other?: any;
  };
  subtotal: number;
  discount: number;
  tax: number;
}

export interface Refund {
  refundId?: string;
  amount: number;
  reason?: string;
  status?: 'initiated' | 'processing' | 'completed' | 'failed';
  method?: 'original_payment' | 'bank_transfer' | 'cash';
  processedBy?: string; // AdminUser ID
  processedAt?: Date;
  notes?: string;
}

export interface PaymentInfo {
  method: 'cod';
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
  transactionId?: string;
  paidAmount: number;
  paidAt?: Date;
  refunds?: Refund[];
  failureReason?: string;
  retryCount?: number;
}

export interface ShippingInfo {
  address: Address;
  method?: 'standard' | 'express' | 'same_day' | 'pickup';
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  trackingNumber?: string;
  carrier?: string;
  shippingCost?: number;
}

export interface TimelineEvent {
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned' | 'refunded';
  timestamp: Date;
  updatedBy?: string; // AdminUser ID
  notes?: string;
  automated?: boolean;
  location?: string;
  metadata?: any;
}

export interface CustomerInfo {
  customerId: string; // Customer ID from Customer model
  name: string;
  email: string;
  phone: string;
  addresses?: Address[]; // Populated addresses from Customer model
}

export interface PricingInfo {
  subtotal: number;
  shippingCharges: number;
  codCharges: number;
  taxes: number;
  discount: number;
  total: number;
}

export interface DeliveryAttempt {
  attemptNumber: number;
  attemptDate: Date;
  status: 'successful' | 'failed' | 'rescheduled';
  reason?: string;
  notes?: string;
  deliveryAgent?: string; // DeliveryAgent ID
  nextAttemptDate?: Date;
}

export interface DeliveryProof {
  type: 'signature' | 'photo' | 'otp' | 'biometric';
  data: string; // Base64 encoded data
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  verifiedBy?: string;
}

export interface DeliveryInfo {
  assignedAgent?: {
    _id: string;
    profile: {
      name: string;
      phone: string;
      employeeId: string;
    };
  };
  attempts?: DeliveryAttempt[];
  proof?: DeliveryProof;
  specialInstructions?: string;
  deliveryWindow?: {
    start: Date;
    end: Date;
  };
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  trackingEnabled?: boolean;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  deliveryStatus?: 'pending' | 'assigned' | 'out_for_delivery' | 'attempted' | 'delivered' | 'failed' | 'rescheduled' | 'cancelled';
}

export interface Order {
  _id: string; // MongoDB ObjectId
  orderId: string; // Custom order ID
  orderNumber: string; // Human-readable order number
  customer: CustomerInfo;
  items: OrderItem[];
  pricing: PricingInfo;
  payment: PaymentInfo;
  shipping: ShippingInfo;
  delivery?: DeliveryInfo;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned' | 'completed';
  timeline?: TimelineEvent[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}