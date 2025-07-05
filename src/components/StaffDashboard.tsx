
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { 
  ShoppingBag, 
  ChefHat, 
  Truck, 
  DollarSign, 
  Clock, 
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from './ui/badge';

export const StaffDashboard = () => {
  const { restaurant, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Request order deletion
  const requestDeletionMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('notifications')
        .insert({
          order_id: orderId,
          staff_id: user?.id,
          admin_id: restaurant?.admin_id,
          notification_type: 'order_deletion_request',
          message: `Staff member ${user?.name} has requested deletion of order ${orderId.slice(0, 8)}`,
          status: 'pending'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Deletion request sent to admin" });
    },
    onError: (error) => {
      console.error('Error requesting deletion:', error);
      toast({ title: "Error sending deletion request", variant: "destructive" });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff Dashboard</h1>
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

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest orders that need attention</CardDescription>
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
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-medium">${order.total_amount}</div>
                      <Badge className={
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }>
                        {order.status}
                      </Badge>
                    </div>
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => requestDeletionMutation.mutate(order.id)}
                        disabled={requestDeletionMutation.isPending}
                      >
                        Request Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No recent orders</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
