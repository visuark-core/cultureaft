import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { DollarSign, ShoppingCart, Users, ArrowUp, ArrowDown, RefreshCw, AlertCircle, UserCheck, UserX, Flag, TrendingUp } from 'lucide-react';
import AnalyticsService from '../services/analyticsService';
import userService from '../services/userService';
import { KPIData, SalesChartDataPoint, CategoryDataPoint, TopProduct, LoadingState, ErrorState } from '../types/analytics';
import { UserStats } from '../types/user';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface KpiCardProps {
    title: string;
    value: string;
    change: string;
    changeType: 'increase' | 'decrease';
    icon: React.ReactNode;
    color: string;
    isLoading?: boolean;
}

const KPI_Card = ({ title, value, change, changeType, icon, color, isLoading }: KpiCardProps) => (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 font-medium">{title}</h3>
            <div className="text-blue-600">{icon}</div>
        </div>
        {isLoading ? (
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
        ) : (
            <>
                <p className="text-3xl font-bold text-gray-800">{value}</p>
                <div className="flex items-center mt-2 text-sm">
                    <span className={`flex items-center font-semibold ${color}`}>
                        {changeType === 'increase' ? <ArrowUp size={16} className="mr-1"/> : <ArrowDown size={16} className="mr-1"/>}
                        {change}
                    </span>
                    <span className="text-gray-500 ml-2">vs. last month</span>
                </div>
            </>
        )}
    </div>
);

const Analytics = () => {
  // State management
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [salesData, setSalesData] = useState<SalesChartDataPoint[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryDataPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userGrowthData, setUserGrowthData] = useState<Array<{name: string, users: number, active: number}>>([]);
  
  const [loading, setLoading] = useState<LoadingState>({
    kpis: true,
    salesChart: true,
    categoryDistribution: true,
    topProducts: true,
    dashboard: true,
    userStats: true,
    userGrowth: true
  } as LoadingState);
  
  const [errors, setErrors] = useState<ErrorState>({
    kpis: null,
    salesChart: null,
    categoryDistribution: null,
    topProducts: null,
    dashboard: null,
    userStats: null,
    userGrowth: null
  } as ErrorState);

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load all analytics data
  const loadAnalyticsData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    }

    try {
      // Load dashboard data and user statistics in parallel
      const [dashboardData] = await Promise.all([
        AnalyticsService.getDashboardData(30),
        loadUserStats()
      ]);
      
      setKpiData(dashboardData.kpis);
      setSalesData(dashboardData.salesChart);
      setCategoryData(dashboardData.categoryDistribution);
      setTopProducts(dashboardData.topProducts);
      
      // Clear any previous errors
      setErrors({
        kpis: null,
        salesChart: null,
        categoryDistribution: null,
        topProducts: null,
        dashboard: null,
        userStats: null,
        userGrowth: null
      } as ErrorState);
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading analytics data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load analytics data';
      
      setErrors(prev => ({
        ...prev,
        dashboard: errorMessage
      }));
    } finally {
      setLoading({
        kpis: false,
        salesChart: false,
        categoryDistribution: false,
        topProducts: false,
        dashboard: false,
        userStats: false,
        userGrowth: false
      } as LoadingState);
      
      if (showRefreshIndicator) {
        setIsRefreshing(false);
      }
    }
  }, []);

  // Load user statistics
  const loadUserStats = useCallback(async () => {
    try {
      // Get user statistics by fetching users with different filters
      const [totalResponse, activeResponse, suspendedResponse, bannedResponse, flaggedResponse] = await Promise.all([
        userService.getUsers({}, 1, 1),
        userService.getUsers({ status: 'active' }, 1, 1),
        userService.getUsers({ status: 'suspended' }, 1, 1),
        userService.getUsers({ status: 'banned' }, 1, 1),
        userService.getUsers({ hasFlags: true }, 1, 1)
      ]);

      const stats: UserStats = {
        totalUsers: totalResponse.data.pagination.totalUsers,
        activeUsers: activeResponse.data.pagination.totalUsers,
        suspendedUsers: suspendedResponse.data.pagination.totalUsers,
        bannedUsers: bannedResponse.data.pagination.totalUsers,
        flaggedUsers: flaggedResponse.data.pagination.totalUsers,
        newUsersThisMonth: totalResponse.data.stats.newUsersThisMonth || 0,
        unverifiedEmails: 0, // Would need separate API call
        unverifiedPhones: 0  // Would need separate API call
      };

      setUserStats(stats);

      // Generate mock user growth data (in real app, this would come from API)
      const mockGrowthData = [
        { name: 'Jan', users: 1200, active: 980 },
        { name: 'Feb', users: 1350, active: 1100 },
        { name: 'Mar', users: 1500, active: 1250 },
        { name: 'Apr', users: 1680, active: 1400 },
        { name: 'May', users: 1850, active: 1550 },
        { name: 'Jun', users: stats.totalUsers, active: stats.activeUsers }
      ];
      setUserGrowthData(mockGrowthData);

    } catch (error) {
      console.error('Error loading user stats:', error);
      setErrors(prev => ({
        ...prev,
        userStats: error instanceof Error ? error.message : 'Failed to load user statistics'
      }));
    }
  }, []);

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    loadAnalyticsData(true);
  }, [loadAnalyticsData]);

  // Initial data load
  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadAnalyticsData(true);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [loadAnalyticsData]);

  // Transform KPI data for display
  const getKpiCards = () => {
    if (!kpiData) return [];

    return [
      {
        title: 'Total Revenue',
        value: AnalyticsService.formatCurrency(kpiData.totalRevenue.value),
        change: AnalyticsService.formatPercentage(kpiData.totalRevenue.change),
        changeType: AnalyticsService.getChangeType(kpiData.totalRevenue.change),
        icon: <DollarSign />,
        color: AnalyticsService.getChangeColorClass(kpiData.totalRevenue.change)
      },
      {
        title: 'Total Sales',
        value: kpiData.totalSales.value.toString(),
        change: AnalyticsService.formatPercentage(kpiData.totalSales.change),
        changeType: AnalyticsService.getChangeType(kpiData.totalSales.change),
        icon: <ShoppingCart />,
        color: AnalyticsService.getChangeColorClass(kpiData.totalSales.change)
      },
      {
        title: 'New Customers',
        value: kpiData.newCustomers.value.toString(),
        change: AnalyticsService.formatPercentage(kpiData.newCustomers.change),
        changeType: AnalyticsService.getChangeType(kpiData.newCustomers.change),
        icon: <Users />,
        color: AnalyticsService.getChangeColorClass(kpiData.newCustomers.change)
      },
      {
        title: 'Avg. Order Value',
        value: AnalyticsService.formatCurrency(kpiData.avgOrderValue.value),
        change: AnalyticsService.formatPercentage(kpiData.avgOrderValue.change),
        changeType: AnalyticsService.getChangeType(kpiData.avgOrderValue.change),
        icon: <DollarSign />,
        color: AnalyticsService.getChangeColorClass(kpiData.avgOrderValue.change)
      }
    ];
  };

  // Transform user stats for display
  const getUserKpiCards = () => {
    if (!userStats) return [];

    return [
      {
        title: 'Total Users',
        value: userStats.totalUsers.toLocaleString(),
        change: '+12.5%', // Mock change - would come from API
        changeType: 'increase' as const,
        icon: <Users />,
        color: 'text-blue-600'
      },
      {
        title: 'Active Users',
        value: userStats.activeUsers.toLocaleString(),
        change: '+8.3%',
        changeType: 'increase' as const,
        icon: <UserCheck />,
        color: 'text-green-600'
      },
      {
        title: 'Flagged Users',
        value: userStats.flaggedUsers.toLocaleString(),
        change: userStats.flaggedUsers > 0 ? '+15.2%' : '0%',
        changeType: userStats.flaggedUsers > 0 ? 'increase' as const : 'decrease' as const,
        icon: <Flag />,
        color: userStats.flaggedUsers > 0 ? 'text-red-600' : 'text-green-600'
      },
      {
        title: 'New This Month',
        value: userStats.newUsersThisMonth.toLocaleString(),
        change: '+22.1%',
        changeType: 'increase' as const,
        icon: <TrendingUp />,
        color: 'text-purple-600'
      }
    ];
  };

  // Error display component
  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="flex items-center justify-center p-8 text-red-600">
      <AlertCircle className="mr-2" size={20} />
      <span>{message}</span>
    </div>
  );

  // Empty state component
  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex items-center justify-center p-8 text-gray-500">
      <span>{message}</span>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Global error message */}
      {errors.dashboard && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <ErrorMessage message={errors.dashboard} />
        </div>
      )}

      {/* Business KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getKpiCards().map(kpi => (
          <KPI_Card key={kpi.title} {...kpi} isLoading={loading.kpis} />
        ))}
      </div>

      {/* User Management KPI Cards */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">User Management Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {getUserKpiCards().map(kpi => (
            <KPI_Card key={kpi.title} {...kpi} isLoading={loading.userStats} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Sales Overview (Last 30 Days)</h3>
          {loading.salesChart ? (
            <div className="animate-pulse h-[300px] bg-gray-200 rounded"></div>
          ) : errors.salesChart ? (
            <ErrorMessage message={errors.salesChart} />
          ) : salesData.length === 0 ? (
            <EmptyState message="No sales data available" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    AnalyticsService.formatCurrency(value as number), 
                    name
                  ]}
                />
                <Legend />
                <Line type="monotone" dataKey="Sales" stroke="#0088FE" strokeWidth={2} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        
        {/* Category Distribution Chart */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Sales by Category</h3>
          {loading.categoryDistribution ? (
            <div className="animate-pulse h-[300px] bg-gray-200 rounded"></div>
          ) : errors.categoryDistribution ? (
            <ErrorMessage message={errors.categoryDistribution} />
          ) : categoryData.length === 0 ? (
            <EmptyState message="No category data available" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [AnalyticsService.formatCurrency(value as number), 'Sales']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* User Management Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* User Growth Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">User Growth (Last 6 Months)</h3>
          {loading.userGrowth ? (
            <div className="animate-pulse h-[300px] bg-gray-200 rounded"></div>
          ) : errors.userGrowth ? (
            <ErrorMessage message={errors.userGrowth} />
          ) : userGrowthData.length === 0 ? (
            <EmptyState message="No user growth data available" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="users" fill="#3B82F6" name="Total Users" />
                <Bar dataKey="active" fill="#10B981" name="Active Users" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        
        {/* User Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">User Status Distribution</h3>
          {loading.userStats ? (
            <div className="animate-pulse h-[300px] bg-gray-200 rounded"></div>
          ) : errors.userStats ? (
            <ErrorMessage message={errors.userStats} />
          ) : !userStats ? (
            <EmptyState message="No user status data available" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Active', value: userStats.activeUsers, color: '#10B981' },
                    { name: 'Suspended', value: userStats.suspendedUsers, color: '#F59E0B' },
                    { name: 'Banned', value: userStats.bannedUsers, color: '#EF4444' },
                    { name: 'Other', value: userStats.totalUsers - userStats.activeUsers - userStats.suspendedUsers - userStats.bannedUsers, color: '#6B7280' }
                  ].filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {[
                    { name: 'Active', value: userStats.activeUsers, color: '#10B981' },
                    { name: 'Suspended', value: userStats.suspendedUsers, color: '#F59E0B' },
                    { name: 'Banned', value: userStats.bannedUsers, color: '#EF4444' },
                    { name: 'Other', value: userStats.totalUsers - userStats.activeUsers - userStats.suspendedUsers - userStats.bannedUsers, color: '#6B7280' }
                  ].filter(item => item.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value.toLocaleString(), 'Users']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      
      {/* Data Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products Table */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Top Selling Products</h3>
          {loading.topProducts ? (
            <div className="animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded mb-2"></div>
              ))}
            </div>
          ) : errors.topProducts ? (
            <ErrorMessage message={errors.topProducts} />
          ) : topProducts.length === 0 ? (
            <EmptyState message="No product data available" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="p-4 font-semibold">Product Name</th>
                    <th className="p-4 font-semibold">SKU</th>
                    <th className="p-4 font-semibold">Units Sold</th>
                    <th className="p-4 font-semibold">Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map(product => (
                    <tr key={product.sku} className="border-b hover:bg-gray-50">
                      <td className="p-4">{product.name}</td>
                      <td className="p-4 text-gray-600">{product.sku}</td>
                      <td className="p-4 font-medium">{product.unitsSold}</td>
                      <td className="p-4 font-medium">{product.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Management Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">User Management Quick Actions</h3>
          {loading.userStats ? (
            <div className="animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded mb-3"></div>
              ))}
            </div>
          ) : errors.userStats ? (
            <ErrorMessage message={errors.userStats} />
          ) : !userStats ? (
            <EmptyState message="No user data available" />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center">
                  <Flag className="h-5 w-5 text-red-600 mr-3" />
                  <div>
                    <div className="font-medium text-red-900">Flagged Users</div>
                    <div className="text-sm text-red-600">{userStats.flaggedUsers} users need attention</div>
                  </div>
                </div>
                <button 
                  onClick={() => window.location.href = '/admin/customers?hasFlags=true'}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Review
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center">
                  <UserX className="h-5 w-5 text-yellow-600 mr-3" />
                  <div>
                    <div className="font-medium text-yellow-900">Suspended Users</div>
                    <div className="text-sm text-yellow-600">{userStats.suspendedUsers} users suspended</div>
                  </div>
                </div>
                <button 
                  onClick={() => window.location.href = '/admin/customers?status=suspended'}
                  className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                >
                  Manage
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <div className="font-medium text-blue-900">New Users This Month</div>
                    <div className="text-sm text-blue-600">{userStats.newUsersThisMonth} new registrations</div>
                  </div>
                </div>
                <button 
                  onClick={() => window.location.href = '/admin/customers?registrationDateFrom=' + new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  View
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <UserCheck className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <div className="font-medium text-green-900">Active Users</div>
                    <div className="text-sm text-green-600">{((userStats.activeUsers / userStats.totalUsers) * 100).toFixed(1)}% of total users</div>
                  </div>
                </div>
                <button 
                  onClick={() => window.location.href = '/admin/customers?status=active'}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  View All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;