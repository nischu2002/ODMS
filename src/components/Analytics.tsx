import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, DollarSign, ShoppingBag, Users, Calendar, BarChart3, PieChart as LucidePieChart, Activity, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalCustomers: number;
  topItems: Array<{ name: string; count: number; revenue: number }>;
  dailyOrders: Array<{ date: string; orders: number; revenue: number }>;
  ordersByStatus: Array<{ status: string; count: number; percentage: number }>;
  monthlyGrowth: number;
  revenueGrowth: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const Analytics = () => {
  const [dateRange, setDateRange] = useState('30'); // days
  const { restaurant } = useAuth();

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', restaurant?.id, dateRange],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!restaurant?.id) throw new Error('No restaurant selected');

      const daysAgo = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      
      // Get orders data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .eq('restaurant_id', restaurant.id)
        .gte('created_at', startDate.toISOString());

      if (ordersError) throw ordersError;

      // Calculate basic metrics
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const totalCustomers = new Set(orders?.map(order => order.customer_phone)).size;

      // Get previous period data for growth calculation
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - daysAgo);
      const { data: prevOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      const prevTotalOrders = prevOrders?.length || 0;
      const prevTotalRevenue = prevOrders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

      const monthlyGrowth = prevTotalOrders > 0 ? ((totalOrders - prevTotalOrders) / prevTotalOrders) * 100 : 0;
      const revenueGrowth = prevTotalRevenue > 0 ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 : 0;

      // Calculate top items
      const itemCounts: { [key: string]: { count: number; revenue: number } } = {};
      orders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          if (!itemCounts[item.name]) {
            itemCounts[item.name] = { count: 0, revenue: 0 };
          }
          itemCounts[item.name].count += item.quantity;
          itemCounts[item.name].revenue += item.quantity * Number(item.price);
        });
      });

      const topItems = Object.entries(itemCounts)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate daily orders
      const dailyData: { [key: string]: { orders: number; revenue: number } } = {};
      orders?.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString();
        if (!dailyData[date]) {
          dailyData[date] = { orders: 0, revenue: 0 };
        }
        dailyData[date].orders += 1;
        dailyData[date].revenue += Number(order.total_amount);
      });

      const dailyOrders = Object.entries(dailyData)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate orders by status
      const statusCounts: { [key: string]: number } = {};
      orders?.forEach(order => {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      });

      const ordersByStatus = Object.entries(statusCounts)
        .map(([status, count]) => ({
          status,
          count,
          percentage: (count / totalOrders) * 100
        }));

      return {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        totalCustomers,
        topItems,
        dailyOrders,
        ordersByStatus,
        monthlyGrowth,
        revenueGrowth
      };
    },
    enabled: !!restaurant?.id
  });

  // Fetch real-time metrics
  const { data: realTimeMetrics } = useQuery({
    queryKey: ['real-time-metrics', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return null;

      const today = new Date().toISOString().split('T')[0];
      
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .gte('created_at', today);

      const { data: pendingOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('status', 'pending');

      const { data: activeStaff } = await supabase
        .from('users')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('is_active', true)
        .in('role', ['restaurant_staff', 'rider']);

      return {
        todayOrders: todayOrders?.length || 0,
        pendingOrders: pendingOrders?.length || 0,
        activeStaff: activeStaff?.length || 0,
        todayRevenue: todayOrders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0
      };
    },
    enabled: !!restaurant?.id,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="flex items-center justify-center p-8">No analytics data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <div className="flex gap-2">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeMetrics?.todayOrders || 0}</div>
            <p className="text-xs text-muted-foreground">Real-time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeMetrics?.pendingOrders || 0}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${realTimeMetrics?.todayRevenue?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">Current day</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeMetrics?.activeStaff || 0}</div>
            <p className="text-xs text-muted-foreground">Online now</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalOrders}</div>
            <p className={`text-xs ${analytics.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analytics.monthlyGrowth >= 0 ? '+' : ''}{analytics.monthlyGrowth.toFixed(1)}% from previous period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalRevenue.toFixed(2)}</div>
            <p className={`text-xs ${analytics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analytics.revenueGrowth >= 0 ? '+' : ''}{analytics.revenueGrowth.toFixed(1)}% from previous period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per order</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Unique customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Orders & Revenue</CardTitle>
            <CardDescription>Orders and revenue trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.dailyOrders}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="orders" fill="#8884d8" name="Orders" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue ($)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
            <CardDescription>Distribution of order statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={analytics.ordersByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percentage }) => `${status} (${percentage.toFixed(1)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Items */}
      <Card>
        <CardHeader>
          <CardTitle>Top Menu Items</CardTitle>
          <CardDescription>Most popular items by quantity sold</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topItems.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">{item.count} orders</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${item.revenue.toFixed(2)}</div>
                  <div className="text-sm text-gray-500">Total revenue</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Predictions & Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Business Insights</CardTitle>
          <CardDescription>AI-powered insights and predictions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Performance Insights</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span>
                    {analytics.monthlyGrowth >= 0 ? 'Positive' : 'Negative'} order growth trend of {Math.abs(analytics.monthlyGrowth).toFixed(1)}%
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span>
                    Average order value is ${analytics.averageOrderValue.toFixed(2)}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <span>
                    {analytics.topItems.length > 0 && `"${analytics.topItems[0].name}" is your best-selling item`}
                  </span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Recommendations</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <span>
                    {analytics.averageOrderValue < 25 
                      ? 'Consider upselling strategies to increase average order value'
                      : 'Great average order value! Continue current strategies'
                    }
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <span>
                    {analytics.totalCustomers < analytics.totalOrders * 0.7
                      ? 'High customer retention rate - focus on customer loyalty programs'
                      : 'Focus on customer acquisition to grow your base'
                    }
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <span>
                    Monitor peak hours and ensure adequate staffing during busy periods
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
