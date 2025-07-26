
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  ShoppingBag, 
  ChefHat, 
  Truck, 
  DollarSign, 
  Clock, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Users,
  Bell,
  Plus,
  LayoutDashboard
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from './ui/badge';
import { OrderManagement } from './OrderManagement';
import { MenuManagement } from './MenuManagement';
import { CreateOrderForm } from './CreateOrderForm';
import { StaffManagement } from './StaffManagement';
import { RiderManagement } from './RiderManagement';
import { NotificationCenter } from './NotificationCenter';
import { useLocation, useNavigate } from 'react-router-dom';

export const StaffDashboard = () => {
  const { restaurant, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get tab from URL parameters
  const urlParams = new URLSearchParams(location.search);
  const urlTab = urlParams.get('tab');
  const [activeTab, setActiveTab] = useState(urlTab || 'overview');

  // Update URL when tab changes
  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'overview') {
      navigate('/restaurant');
    } else {
      navigate(`/restaurant?tab=${tab}`);
    }
  };

  // Fetch staff dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['staff-dashboard', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return null;

      const today = new Date().toISOString().split('T')[0];
      
      // Fetch orders data
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurant.id);

      const { data: todayOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .gte('created_at', today);

      // Fetch menu items
      const { data: menuItems } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurant.id);

      // Get most ordered items
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('name, quantity')
        .in('order_id', orders?.map(o => o.id) || []);

      // Calculate metrics
      const totalOrders = orders?.length || 0;
      const todayOrdersCount = todayOrders?.length || 0;
      const todayRevenue = todayOrders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const pendingOrders = orders?.filter(order => order.status === 'pending').length || 0;
      const preparingOrders = orders?.filter(order => order.status === 'preparing').length || 0;
      const readyOrders = orders?.filter(order => order.status === 'ready').length || 0;
      
      // Calculate most ordered items
      const itemCounts: { [key: string]: number } = {};
      orderItems?.forEach(item => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
      });
      
      const mostOrderedItems = Object.entries(itemCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      return {
        totalOrders,
        todayOrdersCount,
        todayRevenue,
        pendingOrders,
        preparingOrders,
        readyOrders,
        mostOrderedItems,
        recentOrders: orders?.slice(0, 10) || [],
        availableMenuItems: menuItems?.filter(item => item.is_available).length || 0,
        totalMenuItems: menuItems?.length || 0
      };
    },
    enabled: !!restaurant?.id,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case 'orders':
        return <OrderManagement />;
      case 'menu':
        return <MenuManagement />;
      case 'kitchen':
        return <OrderManagement />;
      case 'create-order':
        return <CreateOrderForm />;
      case 'staff':
        return user?.role === 'admin' ? <StaffManagement /> : <div className="text-center py-8 text-gray-500">Access denied. Admin only.</div>;
      case 'riders':
        return user?.role === 'admin' ? <RiderManagement /> : <div className="text-center py-8 text-gray-500">Access denied. Admin only.</div>;
      case 'analytics':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Orders Processed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.todayOrdersCount || 0}</div>
                  <p className="text-sm text-gray-500">Today</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Generated</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${dashboardData?.todayRevenue?.toFixed(2) || '0.00'}</div>
                  <p className="text-sm text-gray-500">Today</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Menu Availability</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardData?.totalMenuItems ? 
                      Math.round((dashboardData.availableMenuItems / dashboardData.totalMenuItems) * 100) : 0}%
                  </div>
                  <p className="text-sm text-gray-500">Available Items</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'notifications':
        return <NotificationCenter />;
      default:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">
                  {user?.role === 'admin' ? 'Admin Dashboard' : 'Staff Dashboard'}
                </h1>
                <p className="text-gray-600">Welcome back, {user?.name}! Here's your daily overview.</p>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.todayOrdersCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Total: {dashboardData?.totalOrders || 0} orders
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${dashboardData?.todayRevenue?.toFixed(2) || '0.00'}</div>
                  <p className="text-xs text-muted-foreground">
                    Sales performance
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.pendingOrders || 0}</div>
                  <p className="text-xs text-muted-foreground">Need attention</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Kitchen Status</CardTitle>
                  <ChefHat className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.preparingOrders || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData?.readyOrders || 0} ready for delivery
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Most Ordered Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Most Ordered Items</CardTitle>
                  <CardDescription>Popular menu items based on total orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData?.mostOrderedItems?.length ? (
                      dashboardData.mostOrderedItems.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-800">
                              {index + 1}
                            </div>
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <Badge variant="secondary">{item.count} orders</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">No order data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Menu Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Menu Overview</CardTitle>
                  <CardDescription>Current menu status and availability</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium">Available Items</span>
                      </div>
                      <span className="text-2xl font-bold text-green-600">
                        {dashboardData?.availableMenuItems || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-gray-600" />
                        <span className="font-medium">Total Items</span>
                      </div>
                      <span className="text-2xl font-bold">
                        {dashboardData?.totalMenuItems || 0}
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm text-gray-600 mb-2">Availability Rate</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ 
                            width: `${dashboardData?.totalMenuItems ? 
                              (dashboardData.availableMenuItems / dashboardData.totalMenuItems) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {dashboardData?.totalMenuItems ? 
                          Math.round((dashboardData.availableMenuItems / dashboardData.totalMenuItems) * 100) : 0}% 
                        of menu items are available
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getTabsList = () => {
    const baseTabs = [
      { value: 'overview', label: 'Overview', icon: LayoutDashboard },
      { value: 'orders', label: 'Orders', icon: ShoppingBag },
      { value: 'menu', label: 'Menu', icon: ChefHat },
      { value: 'create-order', label: 'Create Order', icon: Plus },
      { value: 'analytics', label: 'Analytics', icon: BarChart3 },
      { value: 'notifications', label: 'Notifications', icon: Bell },
    ];

    // Add admin-only tabs
    if (user?.role === 'admin') {
      baseTabs.push(
        { value: 'staff', label: 'Staff', icon: Users },
        { value: 'riders', label: 'Riders', icon: Truck }
      );
    }

    return baseTabs;
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className={`grid w-full ${user?.role === 'admin' ? 'grid-cols-8' : 'grid-cols-6'}`}>
          {getTabsList().map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          {renderTabContent()}
        </div>
      </Tabs>
    </div>
  );
};
