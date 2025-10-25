import { useState, useEffect, useCallback } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, ComposedChart 
} from 'recharts';
import { 
  DollarSign, ShoppingCart, Users, ArrowUp, ArrowDown, RefreshCw, AlertCircle,
  TrendingUp, MapPin, CreditCard, Calendar, Eye,
  Database, Globe, Clock, Target, Award, Activity
} from 'lucide-react';
import AnalyticsService from '../services/analyticsService';
import { 
  KPIData, SalesChartDataPoint, CategoryDataPoint, TopProduct, LoadingState, ErrorState,
  SheetsAnalytics
} from '../types/analytics';
import AnalyticsExport from './components/AnalyticsExport';
import RealTimeAnalytics from './components/RealTimeAnalytics';
import AnalyticsFilters from './components/AnalyticsFilters';
import ServerStatus from './components/ServerStatus';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];
const CHART_COLORS = {
  primary: '#0088FE',
  secondary: '#00C49F',
  accent: '#FFBB28',
  warning: '#FF8042',
  success: '#82CA9D',
  info: '#8884D8'
};



const Analytics = () => {
  // State management
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [salesData, setSalesData] = useState<SalesChartDataPoint[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryDataPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [sheetsAnalytics, setSheetsAnalytics] = useState<SheetsAnalytics | null>(null);
  
  const [loading, setLoading] = useState<LoadingState>({
    kpis: true,
    salesChart: true,
    categoryDistribution: true,
    topProducts: true,
    dashboard: true
  });
  
  const [errors, setErrors] = useState<ErrorState>({
    kpis: null,
    salesChart: null,
    categoryDistribution: null,
    topProducts: null,
    dashboard: null
  });

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // New state for enhanced features
  const [selectedTimeRange, setSelectedTimeRange] = useState<number>(30);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [dataSource, setDataSource] = useState<'database' | 'sheets' | 'both'>('both');
  const [showRealTime, setShowRealTime] = useState<boolean>(true);
  const [filters, setFilters] = useState({
    dateRange: '',
    paymentMethod: '',
    orderStatus: '',
    location: '',
    category: ''
  });

  // Load all analytics data
  const loadAnalyticsData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    }

    console.log('🔄 Loading analytics data...');

    try {
      // First try to get real analytics data
      const dashboardData = await AnalyticsService.getRealAnalyticsData(selectedTimeRange);
      
      console.log('📊 Analytics data received:', {
        hasKpis: !!dashboardData.kpis,
        salesDataPoints: dashboardData.salesChart?.length || 0,
        categoryCount: dashboardData.categoryDistribution?.length || 0,
        topProductsCount: dashboardData.topProducts?.length || 0,
        hasSheetsData: !!dashboardData.sheetsAnalytics
      });
      
      setKpiData(dashboardData.kpis || null);
      setSalesData(dashboardData.salesChart || []);
      setCategoryData(dashboardData.categoryDistribution || []);
      setTopProducts(dashboardData.topProducts || []);
      setSheetsAnalytics(dashboardData.sheetsAnalytics || null);
      
      // Clear any previous errors
      setErrors({
        kpis: null,
        salesChart: null,
        categoryDistribution: null,
        topProducts: null,
        dashboard: null
      });
      
      setLastRefresh(new Date());
      console.log('✅ Analytics data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading analytics data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load analytics data';
      
      // Set fallback empty data to prevent undefined errors
      setKpiData(null);
      setSalesData([]);
      setCategoryData([]);
      setTopProducts([]);
      setSheetsAnalytics(null);
      
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
        dashboard: false
      });
      
      if (showRefreshIndicator) {
        setIsRefreshing(false);
      }
    }
  }, [selectedTimeRange]);

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    loadAnalyticsData(true);
  }, [loadAnalyticsData]);

  // Helper function to get data based on selected source
  const getDisplayData = () => {
    if (dataSource === 'sheets' && sheetsAnalytics) {
      return {
        kpis: sheetsAnalytics.kpis,
        salesChart: sheetsAnalytics.salesChart || [],
        categoryDistribution: sheetsAnalytics.categoryDistribution || [],
        topProducts: sheetsAnalytics.topProducts || []
      };
    } else if (dataSource === 'database') {
      return {
        kpis: kpiData,
        salesChart: salesData || [],
        categoryDistribution: categoryData || [],
        topProducts: topProducts || []
      };
    } else {
      // Both - use database as primary, sheets as secondary
      return {
        kpis: kpiData,
        salesChart: salesData || [],
        categoryDistribution: categoryData || [],
        topProducts: topProducts || []
      };
    }
  };

  const displayData = getDisplayData();

  // Export functionality
  const handleExport = useCallback(async (format: string, dateRange: string) => {
    try {
      // This would typically call an API endpoint to generate and download the export
      console.log(`Exporting analytics data as ${format} for ${dateRange}`);
      
      // For now, we'll create a simple CSV export
      if (format === 'csv') {
        const csvData = generateCSVData();
        downloadCSV(csvData, `analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [displayData]);

  // Generate CSV data
  const generateCSVData = () => {
    const headers = ['Metric', 'Value', 'Change'];
    const rows = [];

    if (displayData.kpis) {
      rows.push(['Total Revenue', displayData.kpis.totalRevenue.value.toString(), displayData.kpis.totalRevenue.change.toString()]);
      rows.push(['Total Sales', displayData.kpis.totalSales.value.toString(), displayData.kpis.totalSales.change.toString()]);
      rows.push(['New Customers', displayData.kpis.newCustomers.value.toString(), displayData.kpis.newCustomers.change.toString()]);
      rows.push(['Avg Order Value', displayData.kpis.avgOrderValue.value.toString(), displayData.kpis.avgOrderValue.change.toString()]);
    }

    return [headers, ...rows];
  };

  // Download CSV file
  const downloadCSV = (data: string[][], filename: string) => {
    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

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

  // Tab navigation component
  const TabNavigation = () => (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      {[
        { id: 'overview', label: 'Overview', icon: Activity },
        { id: 'sales', label: 'Sales', icon: TrendingUp },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'payments', label: 'Payments', icon: CreditCard },
        { id: 'geography', label: 'Geography', icon: MapPin },
        { id: 'products', label: 'Products', icon: Award }
      ].map(tab => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  // Time range selector
  const TimeRangeSelector = () => (
    <div className="flex items-center space-x-2">
      <Calendar className="w-4 h-4 text-gray-500" />
      <select
        value={selectedTimeRange}
        onChange={(e) => setSelectedTimeRange(Number(e.target.value))}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value={7}>Last 7 days</option>
        <option value={30}>Last 30 days</option>
        <option value={90}>Last 90 days</option>
        <option value={365}>Last year</option>
      </select>
    </div>
  );

  // Data source selector
  const DataSourceSelector = () => (
    <div className="flex items-center space-x-2">
      <Database className="w-4 h-4 text-gray-500" />
      <select
        value={dataSource}
        onChange={(e) => setDataSource(e.target.value as 'database' | 'sheets' | 'both')}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="both">All Sources</option>
        <option value="database">Database Only</option>
        <option value="sheets">Google Sheets Only</option>
      </select>
    </div>
  );

  // Enhanced KPI Cards with more metrics
  const EnhancedKPICards = () => {
    const kpis = displayData.kpis;
    if (!kpis) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    const kpiCards = [
      {
        title: 'Total Revenue',
        value: AnalyticsService.formatCurrency(kpis.totalRevenue.value),
        change: AnalyticsService.formatPercentage(kpis.totalRevenue.change),
        changeType: AnalyticsService.getChangeType(kpis.totalRevenue.change),
        icon: <DollarSign />,
        color: AnalyticsService.getChangeColorClass(kpis.totalRevenue.change),
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600'
      },
      {
        title: 'Total Orders',
        value: kpis.totalSales.value.toString(),
        change: AnalyticsService.formatPercentage(kpis.totalSales.change),
        changeType: AnalyticsService.getChangeType(kpis.totalSales.change),
        icon: <ShoppingCart />,
        color: AnalyticsService.getChangeColorClass(kpis.totalSales.change),
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600'
      },
      {
        title: 'New Customers',
        value: kpis.newCustomers.value.toString(),
        change: AnalyticsService.formatPercentage(kpis.newCustomers.change),
        changeType: AnalyticsService.getChangeType(kpis.newCustomers.change),
        icon: <Users />,
        color: AnalyticsService.getChangeColorClass(kpis.newCustomers.change),
        bgColor: 'bg-purple-50',
        iconColor: 'text-purple-600'
      },
      {
        title: 'Avg. Order Value',
        value: AnalyticsService.formatCurrency(kpis.avgOrderValue.value),
        change: AnalyticsService.formatPercentage(kpis.avgOrderValue.change),
        changeType: AnalyticsService.getChangeType(kpis.avgOrderValue.change),
        icon: <Target />,
        color: AnalyticsService.getChangeColorClass(kpis.avgOrderValue.change),
        bgColor: 'bg-orange-50',
        iconColor: 'text-orange-600'
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map(kpi => (
          <div key={kpi.title} className={`${kpi.bgColor} p-6 rounded-xl border border-gray-100`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-700 font-medium text-sm">{kpi.title}</h3>
              <div className={`${kpi.iconColor} p-2 rounded-lg bg-white`}>
                {kpi.icon}
              </div>
            </div>
            {loading.kpis ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900 mb-2">{kpi.value}</p>
                <div className="flex items-center text-sm">
                  <span className={`flex items-center font-semibold ${kpi.color}`}>
                    {kpi.changeType === 'increase' ? <ArrowUp size={16} className="mr-1"/> : <ArrowDown size={16} className="mr-1"/>}
                    {kpi.change}
                  </span>
                  <span className="text-gray-500 ml-2">vs. last period</span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Overview Tab Content
  const OverviewTab = () => (
    <div className="space-y-8">
      <EnhancedKPICards />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Enhanced Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Sales Trend</h3>
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">Last {selectedTimeRange} days</span>
            </div>
          </div>
          {loading.salesChart ? (
            <div className="animate-pulse h-[350px] bg-gray-200 rounded"></div>
          ) : !displayData.salesChart || displayData.salesChart.length === 0 ? (
            <EmptyState message="No sales data available" />
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={displayData.salesChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#666" fontSize={12} />
                <YAxis yAxisId="left" stroke="#666" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#666" fontSize={12} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'Sales' ? AnalyticsService.formatCurrency(value as number) : value,
                    name === 'Sales' ? 'Revenue' : 'Orders'
                  ]}
                  labelStyle={{ color: '#666' }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="Sales" fill={CHART_COLORS.primary} fillOpacity={0.1} stroke={CHART_COLORS.primary} strokeWidth={3} />
                <Bar yAxisId="right" dataKey="orderCount" fill={CHART_COLORS.secondary} opacity={0.7} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
        
        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Category Performance</h3>
          {loading.categoryDistribution ? (
            <div className="animate-pulse h-[350px] bg-gray-200 rounded"></div>
          ) : !displayData.categoryDistribution || displayData.categoryDistribution.length === 0 ? (
            <EmptyState message="No category data available" />
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={displayData.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}\n${((percent ?? 0) * 100).toFixed(1)}%`}
                >
                  {(displayData.categoryDistribution || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [AnalyticsService.formatCurrency(value as number), 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Real-Time Analytics */}
      <RealTimeAnalytics 
        isEnabled={showRealTime}
        onToggle={setShowRealTime}
      />

      {/* Data Source Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real Data Indicator */}
        {(kpiData || salesData.length > 0 || categoryData.length > 0 || topProducts.length > 0) && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Database className="w-6 h-6 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-gray-800">Real Analytics Data Active</h4>
                  <p className="text-sm text-gray-600">
                    Live data from your business • {salesData.length} data points • {topProducts.length} products
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Data source</p>
                <p className="text-sm font-medium text-gray-700">Database + Sheets</p>
              </div>
            </div>
          </div>
        )}

        {/* Google Sheets Data Source Indicator */}
        {sheetsAnalytics && !sheetsAnalytics.error && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Globe className="w-6 h-6 text-green-600" />
                <div>
                  <h4 className="font-semibold text-gray-800">Google Sheets Integration Active</h4>
                  <p className="text-sm text-gray-600">
                    Real-time data from Google Sheets • {sheetsAnalytics.totalOrders} orders • {sheetsAnalytics.totalCustomers} customers
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Last sync</p>
                <p className="text-sm font-medium text-gray-700">
                  {new Date(sheetsAnalytics.lastSyncTime).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* No Data Warning */}
      {!kpiData && salesData.length === 0 && categoryData.length === 0 && topProducts.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
            <div>
              <h4 className="font-semibold text-gray-800">No Analytics Data Available</h4>
              <p className="text-sm text-gray-600 mt-1">
                It looks like there's no data to display. This could be because:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                <li>No orders have been placed yet</li>
                <li>Google Sheets integration is not configured</li>
                <li>Database connection is not working</li>
              </ul>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Retry Loading Data
                </button>
                <button
                  onClick={() => {
                    // This would typically trigger a data seeding process
                    console.log('Seeding sample data...');
                    alert('Sample data seeding would be triggered here. Check the console for the seeding script.');
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Add Sample Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Customer Analytics Tab
  const CustomerTab = () => {
    if (!sheetsAnalytics?.customerInsights) {
      return <EmptyState message="Customer insights not available" />;
    }

    const insights = sheetsAnalytics.customerInsights;

    return (
      <div className="space-y-8">
        {/* Customer KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-700 font-medium">Total Customers</h3>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{insights.totalCustomers}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-700 font-medium">Active Customers</h3>
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{insights.activeCustomers}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-700 font-medium">Total LTV</h3>
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {AnalyticsService.formatCurrency(insights.totalLifetimeValue)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-700 font-medium">Avg. LTV</h3>
              <Target className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {AnalyticsService.formatCurrency(insights.averageLifetimeValue)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Customers */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Top Customers by Value</h3>
            <div className="space-y-4">
              {(insights.topCustomers || []).slice(0, 10).map((customer, index) => (
                <div key={customer.customerId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{customer.name}</p>
                      <p className="text-sm text-gray-500">{customer.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {AnalyticsService.formatCurrency(customer.totalSpent)}
                    </p>
                    <p className="text-sm text-gray-500">{customer.totalOrders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Acquisition Trend */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Customer Acquisition Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={insights.acquisitionTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="customers" stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary} fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  // Payment Analytics Tab
  const PaymentTab = () => {
    if (!sheetsAnalytics?.paymentAnalytics) {
      return <EmptyState message="Payment analytics not available" />;
    }

    const payments = sheetsAnalytics.paymentAnalytics;

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Methods */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Payment Methods</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={payments.methodBreakdown || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ method, percentage }) => `${method} (${percentage.toFixed(1)}%)`}
                >
                  {(payments.methodBreakdown || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Status */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Payment Status</h3>
            <div className="space-y-4">
              {(payments.statusBreakdown || []).map((status, index) => (
                <div key={status.status} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="font-medium capitalize">{status.status}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{status.count} orders</p>
                    <p className="text-sm text-gray-500">
                      {AnalyticsService.formatCurrency(status.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Payment Trends */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Monthly Payment Trends</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={payments.monthlyTrends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [AnalyticsService.formatCurrency(value as number), 'Amount']} />
              <Legend />
              <Bar dataKey="online" stackId="a" fill={CHART_COLORS.primary} name="Online Payments" />
              <Bar dataKey="cod" stackId="a" fill={CHART_COLORS.secondary} name="Cash on Delivery" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Geographic Analytics Tab
  const GeographyTab = () => {
    if (!sheetsAnalytics?.geographicAnalytics) {
      return <EmptyState message="Geographic analytics not available" />;
    }

    const geo = sheetsAnalytics.geographicAnalytics;

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top States */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Top States</h3>
            <div className="space-y-3">
              {(geo.topStates || []).slice(0, 8).map((state, index) => (
                <div key={state.state} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <span className="font-medium">{state.state}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      {AnalyticsService.formatCurrency(state.revenue)}
                    </p>
                    <p className="text-xs text-gray-500">{state.orders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Cities */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Top Cities</h3>
            <div className="space-y-3">
              {(geo.topCities || []).slice(0, 8).map((city, index) => (
                <div key={city.city} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <span className="font-medium">{city.city}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      {AnalyticsService.formatCurrency(city.revenue)}
                    </p>
                    <p className="text-xs text-gray-500">{city.orders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Pincodes */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Top Pincodes</h3>
            <div className="space-y-3">
              {(geo.topPincodes || []).slice(0, 8).map((pincode, index) => (
                <div key={pincode.pincode} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <span className="font-medium">{pincode.pincode}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      {AnalyticsService.formatCurrency(pincode.revenue)}
                    </p>
                    <p className="text-xs text-gray-500">{pincode.orders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Products Tab
  const ProductsTab = () => (
    <div className="space-y-8">
      {/* Top Products Table */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Top Selling Products</h3>
        {loading.topProducts ? (
          <div className="animate-pulse">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded mb-3"></div>
            ))}
          </div>
        ) : !displayData.topProducts || displayData.topProducts.length === 0 ? (
          <EmptyState message="No product data available" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-4 font-semibold">Rank</th>
                  <th className="p-4 font-semibold">Product Name</th>
                  <th className="p-4 font-semibold">SKU</th>
                  <th className="p-4 font-semibold">Units Sold</th>
                  <th className="p-4 font-semibold">Total Revenue</th>
                  <th className="p-4 font-semibold">Performance</th>
                </tr>
              </thead>
              <tbody>
                {(displayData.topProducts || []).map((product, index) => (
                  <tr key={product.sku} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center">
                        <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                          #{index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 font-mono text-sm">{product.sku}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {product.unitsSold} units
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-gray-900">{product.revenue}</td>
                    <td className="p-4">
                      <div className="flex items-center">
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600 font-medium">Strong</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'sales':
        return <OverviewTab />; // Can be customized for sales-specific view
      case 'customers':
        return <CustomerTab />;
      case 'payments':
        return <PaymentTab />;
      case 'geography':
        return <GeographyTab />;
      case 'products':
        return <ProductsTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600 mt-1">Real-time insights from your business data</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <TimeRangeSelector />
          <DataSourceSelector />
          <AnalyticsFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={() => setFilters({
              dateRange: '',
              paymentMethod: '',
              orderStatus: '',
              location: '',
              category: ''
            })}
          />
          
          <ServerStatus />
          
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">
              Updated: {lastRefresh.toLocaleTimeString()}
            </span>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <AnalyticsExport 
            data={displayData} 
            onExport={handleExport}
          />
        </div>
      </div>

      {/* Global error message */}
      {errors.dashboard && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <ErrorMessage message={errors.dashboard} />
            <div className="flex space-x-2">
              <button
                onClick={handleRefresh}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry
              </button>
              <button
                onClick={() => setErrors(prev => ({ ...prev, dashboard: null }))}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Dismiss
              </button>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            <p>📡 Using mock data for demonstration. To enable real analytics:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Ensure the server is running on port 5000</li>
              <li>Check that Google Sheets integration is configured</li>
              <li>Verify database connection is working</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <TabNavigation />

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default Analytics;