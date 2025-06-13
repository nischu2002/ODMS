
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../context/AuthContext';
import { Plus, ChefHat, Truck, Clock, DollarSign } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { Order, OrderItem } from '../types';

export const StaffDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    items: [{ name: '', quantity: 1, price: 0 }] as OrderItem[]
  });
  const { restaurant, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
  }, [restaurant]);

  const loadOrders = () => {
    if (!restaurant) return;
    
    const existingOrders = localStorage.getItem(`orders_${restaurant.id}`);
    if (existingOrders) {
      setOrders(JSON.parse(existingOrders));
    }
  };

  const saveOrders = (ordersList: Order[]) => {
    if (!restaurant) return;
    localStorage.setItem(`orders_${restaurant.id}`, JSON.stringify(ordersList));
    setOrders(ordersList);
  };

  const createOrder = () => {
    if (!restaurant || !user) return;

    const totalAmount = newOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const order: Order = {
      id: 'ORD-' + Date.now(),
      restaurantId: restaurant.id,
      customerName: newOrder.customerName,
      customerPhone: newOrder.customerPhone,
      customerAddress: newOrder.customerAddress,
      items: newOrder.items.map((item, index) => ({ ...item, id: `item-${index}` })),
      totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      paymentStatus: 'pending'
    };

    saveOrders([...orders, order]);
    setNewOrder({
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      items: [{ name: '', quantity: 1, price: 0 }]
    });
    setShowNewOrder(false);
    toast({ title: "Order created successfully" });
  };

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    const updatedOrders = orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    saveOrders(updatedOrders);
    toast({ title: `Order ${newStatus}` });
  };

  const assignToKitchen = (orderId: string) => {
    updateOrderStatus(orderId, 'confirmed');
  };

  const assignRider = (orderId: string, riderId: string) => {
    const updatedOrders = orders.map(order => 
      order.id === orderId ? { ...order, riderId, status: 'assigned' } : order
    );
    saveOrders(updatedOrders);
    toast({ title: "Rider assigned successfully" });
  };

  const addOrderItem = () => {
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { name: '', quantity: 1, price: 0 }]
    });
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    const updatedItems = newOrder.items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setNewOrder({ ...newOrder, items: updatedItems });
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Staff Dashboard</h1>
        <Button onClick={() => setShowNewOrder(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Order
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders.length}</div>
            <p className="text-xs text-muted-foreground">Need kitchen assignment</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Kitchen</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{preparingOrders.length}</div>
            <p className="text-xs text-muted-foreground">Being prepared</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready for Delivery</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readyOrders.length}</div>
            <p className="text-xs text-muted-foreground">Need rider assignment</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* New Order Form */}
      {showNewOrder && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={newOrder.customerName}
                    onChange={(e) => setNewOrder({...newOrder, customerName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    value={newOrder.customerPhone}
                    onChange={(e) => setNewOrder({...newOrder, customerPhone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerAddress">Address</Label>
                  <Input
                    id="customerAddress"
                    value={newOrder.customerAddress}
                    onChange={(e) => setNewOrder({...newOrder, customerAddress: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label>Order Items</Label>
                {newOrder.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 mt-2">
                    <Input
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => updateOrderItem(index, 'name', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value))}
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={item.price}
                      onChange={(e) => updateOrderItem(index, 'price', parseFloat(e.target.value))}
                    />
                    <Button type="button" variant="outline" onClick={addOrderItem}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button onClick={createOrder}>Create Order</Button>
                <Button variant="outline" onClick={() => setShowNewOrder(false)}>Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Manage order status and assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.slice(0, 10).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">{order.id}</h3>
                  <p className="text-sm text-gray-600">{order.customerName} - {order.customerPhone}</p>
                  <p className="text-sm text-gray-600">{order.items.length} items - ${order.totalAmount}</p>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                    order.status === 'ready' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {order.status === 'pending' && (
                    <Button size="sm" onClick={() => assignToKitchen(order.id)}>
                      Send to Kitchen
                    </Button>
                  )}
                  {order.status === 'confirmed' && (
                    <Button size="sm" onClick={() => updateOrderStatus(order.id, 'preparing')}>
                      Start Preparing
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button size="sm" onClick={() => updateOrderStatus(order.id, 'ready')}>
                      Mark Ready
                    </Button>
                  )}
                  {order.status === 'ready' && (
                    <Button size="sm" onClick={() => updateOrderStatus(order.id, 'assigned')}>
                      Assign Rider
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="text-center text-gray-500 py-8">No orders yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
