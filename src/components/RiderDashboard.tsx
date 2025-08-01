import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { MapPin, Truck, Clock, CheckCircle, Navigation, Phone, User, LayoutDashboard, Package, Bell } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { RiderLocationManager } from './RiderLocationManager';
import { NotificationCenter } from './NotificationCenter';
import { useLocation } from 'react-router-dom';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  assigned_rider_id?: string;
  order_items?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}

export const RiderDashboard = () => {
  const [isOnline, setIsOnline] = useState(false);
  const location = useLocation();
  const activeTab = new URLSearchParams(location.search).get('tab') || 'dashboard';
  const { restaurant, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const ordersChannelRef = useRef<any>(null);
  const availableOrdersChannelRef = useRef<any>(null);

  // Load rider online status
  useEffect(() => {
    if (user?.id) {
      const savedStatus = localStorage.getItem(`rider_online_${user.id}`);
      setIsOnline(savedStatus === 'true');
    }
  }, [user?.id]);

  // Fetch orders assigned to this rider
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['rider-orders', restaurant?.id, user?.id],
    queryFn: async () => {
      if (!restaurant?.id || !user?.id) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .eq('restaurant_id', restaurant.id)
        .eq('assigned_rider_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
    enabled: !!restaurant?.id && !!user?.id,
    refetchInterval: 15000 // Reduced frequency to prevent overloading
  });

  // Fetch available orders (ready for pickup)
  const { data: availableOrders = [] } = useQuery({
    queryKey: ['available-orders', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .eq('restaurant_id', restaurant.id)
        .eq('status', 'ready')
        .is('assigned_rider_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Order[];
    },
    enabled: !!restaurant?.id && isOnline,
    refetchInterval: 10000 // Reduced frequency
  });

  // Set up real-time subscriptions with proper cleanup
  useEffect(() => {
    if (!restaurant?.id || !user?.id) return;

    // Clean up existing channels
    if (ordersChannelRef.current) {
      supabase.removeChannel(ordersChannelRef.current);
      ordersChannelRef.current = null;
    }
    if (availableOrdersChannelRef.current) {
      supabase.removeChannel(availableOrdersChannelRef.current);
      availableOrdersChannelRef.current = null;
    }

    // Set up orders subscription with unique channel name
    const ordersChannelName = `rider-orders-${user.id}-${Date.now()}`;
    const ordersChannel = supabase
      .channel(ordersChannelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `assigned_rider_id=eq.${user.id}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['rider-orders', restaurant.id, user.id] });
      })
      .subscribe();

    ordersChannelRef.current = ordersChannel;

    // Set up available orders subscription if online
    if (isOnline) {
      const availableOrdersChannelName = `available-orders-${user.id}-${Date.now()}`;
      const availableOrdersChannel = supabase
        .channel(availableOrdersChannelName)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurant.id}`
        }, () => {
          queryClient.invalidateQueries({ queryKey: ['available-orders', restaurant.id] });
        })
        .subscribe();

      availableOrdersChannelRef.current = availableOrdersChannel;
    }

    return () => {
      if (ordersChannelRef.current) {
        supabase.removeChannel(ordersChannelRef.current);
        ordersChannelRef.current = null;
      }
      if (availableOrdersChannelRef.current) {
        supabase.removeChannel(availableOrdersChannelRef.current);
        availableOrdersChannelRef.current = null;
      }
    };
  }, [restaurant?.id, user?.id, isOnline, queryClient]);

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      if (newStatus === 'delivered') {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          await supabase.from('analytics_events').insert({
            restaurant_id: restaurant?.id,
            event_type: 'order_completed',
            event_data: { order_id: orderId, total_amount: order.total_amount }
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rider-orders', restaurant?.id, user?.id] });
      toast({ title: "Order status updated successfully" });
    },
    onError: (error) => {
      console.error('Error updating order status:', error);
      toast({ title: "Error updating order status", variant: "destructive" });
    }
  });

  // Accept order mutation
  const acceptOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('orders')
        .update({ 
          assigned_rider_id: user?.id,
          status: 'assigned' 
        })
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rider-orders', restaurant?.id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['available-orders', restaurant?.id] });
      toast({ title: "Order accepted successfully" });
    },
    onError: (error) => {
      console.error('Error accepting order:', error);
      toast({ title: "Error accepting order", variant: "destructive" });
    }
  });

  const toggleOnlineStatus = () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    if (user?.id) {
      localStorage.setItem(`rider_online_${user.id}`, newStatus.toString());
    }
    
    toast({ 
      title: newStatus ? "You're now online" : "You're now offline",
      description: newStatus ? "You can receive new deliveries" : "You won't receive new deliveries"
    });
  };

  const startNavigation = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(mapsUrl, '_blank');
    
    toast({ 
      title: "Navigation started",
      description: `Opening maps for: ${address}`
    });
  };

  const callCustomer = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  // Filter orders by status
  const assignedOrders = orders.filter(o => o.status === 'assigned');
  const pickedUpOrders = orders.filter(o => o.status === 'picked_up');
  const deliveredOrders = orders.filter(o => o.status === 'delivered');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'picked_up': return 'bg-yellow-100 text-yellow-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading orders...</div>;
  }

  const renderDashboardContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Rider Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={isOnline}
              onCheckedChange={toggleOnlineStatus}
            />
            <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Rider Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-4 h-4 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-lg font-medium">
                {isOnline ? 'Online & Available for Deliveries' : 'Offline - Not receiving orders'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Total Deliveries Today: {deliveredOrders.filter(o => 
                new Date(o.created_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready for Pickup</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedOrders.length}</div>
            <p className="text-xs text-muted-foreground">Assigned to you</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pickedUpOrders.length}</div>
            <p className="text-xs text-muted-foreground">On the way to customer</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deliveredOrders.filter(o => 
                new Date(o.created_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>
      </div>

      {/* Available Orders (when online) */}
      {isOnline && availableOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Orders</CardTitle>
            <CardDescription>Orders ready for pickup - accept to start delivery</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {availableOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <div>
                        <h3 className="font-medium">{order.customer_name}</h3>
                        <p className="text-sm text-gray-600">{order.customer_phone}</p>
                        <p className="text-sm text-gray-600">{order.customer_address}</p>
                        <p className="text-sm font-medium">NPR {order.total_amount} • {order.order_items?.length || 0} items</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">
                      Ready for {Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / (1000 * 60))} min
                    </Badge>
                    <Button 
                      size="sm" 
                      onClick={() => acceptOrderMutation.mutate(order.id)}
                      disabled={acceptOrderMutation.isPending}
                    >
                      Accept Order
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assigned Deliveries */}
      {assignedOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assigned Deliveries</CardTitle>
            <CardDescription>Orders assigned to you - ready for pickup</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignedOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                  <div className="flex-1">
                    <h3 className="font-medium">{order.customer_name}</h3>
                    <p className="text-sm text-gray-600">{order.customer_address}</p>
                    <p className="text-sm font-medium">NPR {order.total_amount} • {order.order_items?.length || 0} items</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <Badge variant="outline">
                        {order.payment_status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => callCustomer(order.customer_phone)}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => startNavigation(order.customer_address)}
                    >
                      <Navigation className="h-4 w-4 mr-1" />
                      Navigate
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => updateOrderMutation.mutate({ orderId: order.id, newStatus: 'picked_up' })}
                      disabled={updateOrderMutation.isPending}
                    >
                      Mark Picked Up
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* In Transit Deliveries */}
      {pickedUpOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>In Transit</CardTitle>
            <CardDescription>Orders on the way to customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pickedUpOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                  <div className="flex-1">
                    <h3 className="font-medium">{order.customer_name}</h3>
                    <p className="text-sm text-gray-600">{order.customer_address}</p>
                    <p className="text-sm font-medium">NPR {order.total_amount} • {order.order_items?.length || 0} items</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <Badge variant="outline">
                        {order.payment_status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => callCustomer(order.customer_phone)}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => startNavigation(order.customer_address)}
                    >
                      <Navigation className="h-4 w-4 mr-1" />
                      Navigate
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => updateOrderMutation.mutate({ orderId: order.id, newStatus: 'delivered' })}
                      disabled={updateOrderMutation.isPending}
                    >
                      Mark Delivered
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Deliveries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Deliveries</CardTitle>
          <CardDescription>Your completed deliveries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deliveredOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                <div className="flex-1">
                  <h3 className="font-medium">{order.customer_name}</h3>
                  <p className="text-sm text-gray-600">{order.customer_address}</p>
                  <p className="text-sm text-gray-600">NPR {order.total_amount} • Delivered {new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">Delivered</span>
                </div>
              </div>
            ))}
            {deliveredOrders.length === 0 && (
              <p className="text-center text-gray-500 py-8">No deliveries completed yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Offline Message */}
      {!isOnline && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6 text-center">
            <MapPin className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-orange-800">You're Currently Offline</h3>
            <p className="text-orange-700 mb-4">Go online to start receiving delivery assignments and see available orders</p>
            <Button onClick={toggleOnlineStatus} className="bg-orange-600 hover:bg-orange-700">
              Go Online Now
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'deliveries':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">My Deliveries</h2>
            <div className="grid gap-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{order.customer_name}</h3>
                        <p className="text-sm text-gray-600">{order.customer_address}</p>
                        <p className="text-sm font-medium">NPR {order.total_amount}</p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      case 'location':
        return <RiderLocationManager />;
      case 'history':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Delivery History</h2>
            <div className="grid gap-4">
              {deliveredOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{order.customer_name}</h3>
                        <p className="text-sm text-gray-600">{order.customer_address}</p>
                        <p className="text-sm font-medium">NPR {order.total_amount}</p>
                        <p className="text-sm text-gray-500">Delivered on {new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      case 'notifications':
        return <NotificationCenter />;
      case 'profile':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Rider Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-sm text-gray-600">{user?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <p className="text-sm text-gray-600">{user?.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return renderDashboardContent();
    }
  };

  return (
    <div className="space-y-6">
      {renderTabContent()}
    </div>
  );
};
