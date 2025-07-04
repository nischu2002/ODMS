
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  ShoppingBag, 
  BarChart3, 
  Settings,
  ChefHat,
  DollarSign,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

// Import component modules
import { StaffManagement } from '../components/StaffManagement';
import { RiderManagement } from '../components/RiderManagement';
import { OrderManagement } from '../components/OrderManagement';
import { MenuManagement } from '../components/MenuManagement';
import { Analytics } from '../components/Analytics';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { restaurant } = useAuth();
  const { toast } = useToast();

  // Set active tab based on URL or sessionStorage
  useEffect(() => {
    const savedTab = sessionStorage.getItem('adminDashboardTab');
    if (savedTab) {
      setActiveTab(savedTab);
      sessionStorage.removeItem('adminDashboardTab');
    }
  }, []);

  // Fetch dashboard overview data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['admin-dashboard', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return null;

      // Get today's date
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

      // Fetch staff data
      const { data: staff } = await supabase
        .from('users')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('role', 'restaurant_staff');

      // Fetch riders data
      const { data: riders } = await supabase
        .from('users')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('role', 'rider');

      // Fetch menu items
      const { data: menuItems } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurant.id);

      // Calculate metrics
      const totalOrders = orders?.length || 0;
      const todayOrdersCount = todayOrders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const todayRevenue = todayOrders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const activeStaff = staff?.filter(s => s.is_active).length || 0;
      const activeRiders = riders?.filter(r => r.is_active).length || 0;
      const availableMenuItems = menuItems?.filter(item => item.is_available).length || 0;
      
      // Get pending orders
      const pendingOrders = orders?.filter(order => order.status === 'pending').length || 0;
      
      // Get recent orders
      const recentOrders = orders?.slice(0, 5) || [];

      return {
        totalOrders,
        todayOrdersCount,
        totalRevenue,
        todayRevenue,
        activeStaff,
        activeRiders,
        availableMenuItems,
        pendingOrders,
        recentOrders,
        staffCount: staff?.length || 0,
        ridersCount: riders?.length || 0,
        menuItemsCount: menuItems?.length || 0
      };
    },
    enabled: !!restaurant?.id,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case 'staff':
        return <StaffManagement />;
      case 'riders':
        return <RiderManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'menu':
        return <MenuManagement />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Restaurant Settings</h2>
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Information</CardTitle>
                <CardDescription>Manage your restaurant details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <strong>Name:</strong> {restaurant?.name}
                  </div>
                  <div>
                    <strong>Domain:</strong> {restaurant?.domain}.odms.com
                  </div>
                  <div>
                    <strong>Email:</strong> {restaurant?.email}
                  </div>
                  <div>
                    <strong>Phone:</strong> {restaurant?.phone}
                  </div>
                  <div>
                    <strong>Address:</strong> {restaurant?.address}
                  </div>
                  <Button>Edit Restaurant Details</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Restaurant Admin Dashboard</h1>
              <div className="text-sm text-gray-600">
                Welcome back! Here's what's happening with your restaurant today.
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
                    Total: ${dashboardData?.totalRevenue?.toFixed(2) || '0.00'}
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
                  <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.activeStaff || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData?.activeRiders || 0} riders online
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Staff Management
                  </CardTitle>
                  <CardDescription>
                    Manage your restaurant staff and their permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>{dashboardData?.staffCount || 0}</strong> total staff members
                    </div>
                    <div className="text-sm">
                      <strong>{dashboardData?.activeStaff || 0}</strong> currently active
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => setActiveTab('staff')}
                    >
                      Manage Staff
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Delivery Riders
                  </CardTitle>
                  <CardDescription>
                    Manage delivery riders and assignments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>{dashboardData?.ridersCount || 0}</strong> total riders
                    </div>
                    <div className="text-sm">
                      <strong>{dashboardData?.activeRiders || 0}</strong> currently active
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => setActiveTab('riders')}
                    >
                      Manage Riders
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5" />
                    Menu Items
                  </CardTitle>
                  <CardDescription>
                    Manage your restaurant menu and pricing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>{dashboardData?.menuItemsCount || 0}</strong> total items
                    </div>
                    <div className="text-sm">
                      <strong>{dashboardData?.availableMenuItems || 0}</strong> available now
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => setActiveTab('menu')}
                    >
                      Manage Menu
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest orders from your restaurant</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.recentOrders?.length ? (
                    dashboardData.recentOrders.map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">{order.customer_name}</div>
                          <div className="text-sm text-gray-500">
                            {order.customer_phone} • {new Date(order.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${order.total_amount}</div>
                          <div className={`text-sm px-2 py-1 rounded-full ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {order.status}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No recent orders</p>
                  )}
                </div>
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setActiveTab('orders')}
                  >
                    View All Orders
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Staff
          </TabsTrigger>
          <TabsTrigger value="riders" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Riders
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="menu" className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Menu
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {renderTabContent()}
        </div>
      </Tabs>
    </DashboardLayout>
  );
}
