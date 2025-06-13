
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { MapPin, Truck, Clock, CheckCircle, Navigation } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { Order } from '../types';

export const RiderDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const { restaurant, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
  }, [restaurant, user]);

  const loadOrders = () => {
    if (!restaurant || !user) return;
    
    const existingOrders = localStorage.getItem(`orders_${restaurant.id}`);
    if (existingOrders) {
      const allOrders = JSON.parse(existingOrders);
      // Filter orders assigned to this rider
      const myOrders = allOrders.filter((order: Order) => order.riderId === user.id);
      setOrders(myOrders);
    }
  };

  const saveOrders = (ordersList: Order[]) => {
    if (!restaurant) return;
    
    // Get all orders and update only the ones for this rider
    const allOrders = JSON.parse(localStorage.getItem(`orders_${restaurant.id}`) || '[]');
    const updatedAllOrders = allOrders.map((order: Order) => {
      const updatedOrder = ordersList.find(o => o.id === order.id);
      return updatedOrder || order;
    });
    
    localStorage.setItem(`orders_${restaurant.id}`, JSON.stringify(updatedAllOrders));
    setOrders(ordersList);
  };

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    const updatedOrders = orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    saveOrders(updatedOrders);
    toast({ title: `Order marked as ${newStatus}` });
  };

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    toast({ 
      title: isOnline ? "You're now offline" : "You're now online",
      description: isOnline ? "You won't receive new deliveries" : "You can receive new deliveries"
    });
  };

  const startNavigation = (address: string) => {
    // In a real app, this would integrate with Google Maps or similar
    toast({ 
      title: "Navigation started",
      description: `Navigating to: ${address}`
    });
  };

  const assignedOrders = orders.filter(o => o.status === 'assigned');
  const pickedUpOrders = orders.filter(o => o.status === 'picked_up');
  const deliveredOrders = orders.filter(o => o.status === 'delivered');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Rider Dashboard</h1>
        <Button 
          onClick={toggleOnlineStatus}
          variant={isOnline ? "destructive" : "default"}
          className="flex items-center gap-2"
        >
          <MapPin className="h-4 w-4" />
          {isOnline ? 'Go Offline' : 'Go Online'}
        </Button>
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
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isOnline ? 'Online & Available' : 'Offline'}
            </span>
            <span className="text-sm text-gray-600">
              Total Deliveries Today: {deliveredOrders.length}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Deliveries</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedOrders.length}</div>
            <p className="text-xs text-muted-foreground">Ready for pickup</p>
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
            <div className="text-2xl font-bold">{deliveredOrders.length}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Deliveries */}
      {assignedOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assigned Deliveries</CardTitle>
            <CardDescription>Orders ready for pickup</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignedOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                  <div className="flex-1">
                    <h3 className="font-medium">{order.id}</h3>
                    <p className="text-sm text-gray-600">{order.customerName} - {order.customerPhone}</p>
                    <p className="text-sm text-gray-600">{order.customerAddress}</p>
                    <p className="text-sm font-medium">${order.totalAmount}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => startNavigation(order.customerAddress)}
                    >
                      <Navigation className="h-4 w-4 mr-1" />
                      Navigate
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => updateOrderStatus(order.id, 'picked_up')}
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
                    <h3 className="font-medium">{order.id}</h3>
                    <p className="text-sm text-gray-600">{order.customerName} - {order.customerPhone}</p>
                    <p className="text-sm text-gray-600">{order.customerAddress}</p>
                    <p className="text-sm font-medium">${order.totalAmount}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => startNavigation(order.customerAddress)}
                    >
                      <Navigation className="h-4 w-4 mr-1" />
                      Navigate
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
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
          <CardDescription>Completed deliveries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deliveredOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                <div className="flex-1">
                  <h3 className="font-medium">{order.id}</h3>
                  <p className="text-sm text-gray-600">{order.customerName}</p>
                  <p className="text-sm text-gray-600">${order.totalAmount}</p>
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

      {!isOnline && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6 text-center">
            <MapPin className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-orange-800">You're Currently Offline</h3>
            <p className="text-orange-700 mb-4">Go online to start receiving delivery assignments</p>
            <Button onClick={toggleOnlineStatus} className="bg-orange-600 hover:bg-orange-700">
              Go Online Now
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
