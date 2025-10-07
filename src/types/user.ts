// User management type definitions

export interface UserFlag {
  _id: string;
  type: 'suspicious_activity' | 'multiple_failed_logins' | 'unusual_spending' | 'policy_violation' | 'fraud_suspected' | 'account_compromise' | 'spam_behavior' | 'manual_review' | 'payment_issues' | 'security_concern';
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdBy?: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
    };
    email: string;
  };
  resolved: boolean;
  resolvedBy?: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
    };
    email: string;
  };
  resolvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserNote {
  _id: string;
  content: string;
  createdBy: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
    };
    email: string;
  };
  isPrivate: boolean;
  createdAt: string;
}

export interface UserActivity {
  lastLogin?: string;
  loginCount: number;
  pageViews: number;
  sessionDuration: number;
  lastPageVisited?: string;
  deviceInfo?: {
    userAgent?: string;
    browser?: string;
    os?: string;
    device?: string;
  };
  ipAddresses: Array<{
    ip: string;
    timestamp: string;
  }>;
  failedLoginAttempts: number;
  lastFailedLogin?: string;
}

export interface UserAnalytics {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: string;
  favoriteCategories: Array<{
    category: string;
    count: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    lastUsed: string;
  }>;
  engagementScore: number;
  lifetimeValue: number;
  churnRisk: 'low' | 'medium' | 'high';
  segmentation: 'new' | 'active' | 'loyal' | 'at_risk' | 'churned' | 'vip';
}

export interface UserAddress {
  _id: string;
  type: 'home' | 'work' | 'other';
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

export interface UserPreferences {
  newsletter: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  language: 'en' | 'hi' | 'es' | 'fr' | 'de';
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  timezone: string;
}

export interface User {
  _id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  avatar?: string;
  addresses: UserAddress[];
  preferences: UserPreferences;
  status: 'active' | 'inactive' | 'suspended' | 'banned' | 'pending_verification';
  emailVerified: boolean;
  phoneVerified: boolean;
  registrationDate: string;
  activity: UserActivity;
  flags?: UserFlag[];
  analytics?: UserAnalytics;
  notes?: UserNote[];
  createdAt: string;
  updatedAt: string;
}

export interface UserSearchFilters {
  search?: string;
  status?: string;
  registrationDateFrom?: string;
  registrationDateTo?: string;
  minOrders?: number;
  maxOrders?: number;
  minSpent?: number;
  maxSpent?: number;
  segmentation?: string;
  hasFlags?: boolean;
  flagType?: string;
  tags?: string[];
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

export interface UserListResponse {
  success: boolean;
  message: string;
  data: {
    users: User[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalUsers: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    stats: {
      totalUsers: number;
      activeUsers: number;
      suspendedUsers: number;
      bannedUsers: number;
      newUsersThisMonth: number;
    };
    filters: UserSearchFilters;
  };
}

export interface UserDetailResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

export interface UserActivityResponse {
  success: boolean;
  message: string;
  data: {
    activity: UserActivity;
    auditLogs: Array<{
      _id: string;
      adminId: {
        _id: string;
        profile: {
          firstName: string;
          lastName: string;
        };
        email: string;
      };
      action: string;
      resource: string;
      resourceId: string;
      changes: any;
      timestamp: string;
      severity: string;
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalLogs: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface BulkOperationResult {
  successful: Array<{
    userId: string;
    user?: User;
    oldStatus?: string;
    newStatus?: string;
  }>;
  failed: Array<{
    userId: string;
    error: string;
    data?: any;
  }>;
  totalProcessed: number;
  totalSuccessful: number;
  totalFailed: number;
}

export interface BulkOperationResponse {
  success: boolean;
  message: string;
  data: BulkOperationResult;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  bannedUsers: number;
  newUsersThisMonth: number;
  flaggedUsers: number;
  unverifiedEmails: number;
  unverifiedPhones: number;
}