
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../context/AuthContext';
import { Plus, Clock, CheckCircle, Truck, User, Phone, MapPin } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { Order, OrderItem, DeliveryRider } from '../types';

export const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<DeliveryRider[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    items: [{ name: '', quantity: 1, price: 0 }]
  });
  const { restaurant } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
    loadRiders();
    loadStaff();
  }, [restaurant]);

  const loadOrders = () => {
    if (!restaurant) return;
    const existingOrders = localStorage.getItem(`orders_${restaurant.id}`);
    if (existingOrders) {
      setOrders(JSON.parse(existingOrders));
    }
  };

  const loadRiders = () => {
    if (!restaurant) return;
    const existingRiders = localStorage.getItem(`riders_${restaurant.id}`);
    if (existingRiders) {
      setRiders(JSON.parse(existingRiders));
    }
  };

  const loadStaff = () => {
    if (!restaurant) return;
    const existingStaff = localStorage.getItem(`staff_${restaurant.id}`);
    if (existingStaff) {
      setStaff(JSON.parse(existingStaff));
    }
  };

  const saveOrders = (ordersList: Order[]) => {
    if (!restaurant) return;
    localStorage.setItem(`orders_${restaurant.id}`, JSON.stringify(ordersList));
    setOrders(ordersList);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    const orderItems: OrderItem[] = formData.items.map((item, index) => ({
      id: `item-${Date.now()}-${index}`,
      name: item.name,
      quantity: item.quantity,
      price: item.price
    }));

    const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const newOrder: Order = {
      id: 'order-' + Date.now(),
      restaurantId: restaurant.id,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerAddress: formData.customerAddress,
      items: orderItems,
      totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      paymentStatus: 'pending'
    };

    saveOrders([...orders, newOrder]);
    toast({ title: "Order created successfully" });
    
    setFormData({
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      items: [{ name: '', quantity: 1, price: 0 }]
    });
    setShowAddForm(false);
  };

  const updateOrderStatus = (orderId: string, newStatus: Order['status'], assignedRiderId?: string) => {
    const updatedOrders = orders.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus, ...(assignedRiderId && { assignedRiderId, riderId: assignedRiderId }) }
        : order
    );
    saveOrders(updatedOrders);
    toast({ title: `Order status updated to ${newStatus}` });
  };

  const assignToKitchen = (orderId: string) => {
    updateOrderStatus(orderId, 'preparing');
  };

  const markAsReady = (orderId: string) => {
    updateOrderStatus(orderId, 'ready');
  };

  const assignToRider = (orderId: string, riderId: string) => {
    updateOrderStatus(orderId, 'assigned', riderId);
  };

  const addOrderItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', quantity: 1, price: 0 }]
    });
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    const updatedItems = formData.items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setFormData({ ...formData, items: updatedItems });
  };

  const removeOrderItem = (index: number) => {
    if (formData.items.length > 1) {
      const updatedItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: updatedItems });
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'assigned': return 'bg-purple-100 text-purple-800';
      case 'picked_up': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-200 text-green-900';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const availableRiders = riders.filter(r => r.isActive && r.isOnline);
  const kitchenStaff = staff.filter(s => s.isActive && (s.role === 'kitchen_staff' || s.role === 'manager'));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Order Management</h2>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Order
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Order</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Customer Phone</Label>
                  <Input
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerAddress">Delivery Address</Label>
                  <Input
                    id="customerAddress"
                    value={formData.customerAddress}
                    onChange={(e) => setFormData({...formData, customerAddress: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Order Items</Label>
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => updateOrderItem(index, 'name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        placeholder="Qty"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value))}
                        required
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        placeholder="Price"
                        step="0.01"
                        min="0"
                        value={item.price}
                        onChange={(e) => updateOrderItem(index, 'price', parseFloat(e.target.value))}
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeOrderItem(index)}
                      disabled={formData.items.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addOrderItem}>
                  Add Item
                </Button>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Create Order</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active Orders ({orders.length})</CardTitle>
          <CardDescription>Manage current orders and assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Order #{order.id.slice(-6)}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {order.customerName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {order.customerPhone}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {order.customerAddress}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">${order.totalAmount.toFixed(2)}</p>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Order Items:</h4>
                    <ul className="space-y-1 text-sm">
                      {order.items.map((item) => (
                        <li key={item.id} className="flex justify-between">
                          <span>{item.quantity}x {item.name}</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Actions:</h4>
                    <div className="flex flex-wrap gap-2">
                      {order.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => assignToKitchen(order.id)}
                          className="flex items-center gap-1"
                        >
                          <Clock className="h-4 w-4" />
                          Assign to Kitchen
                        </Button>
                      )}
                      
                      {order.status === 'preparing' && (
                        <Button
                          size="sm"
                          onClick={() => markAsReady(order.id)}
                          className="flex items-center gap-1"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark Ready
                        </Button>
                      )}
                      
                      {(order.status === 'ready' || order.status === 'confirmed') && availableRiders.length > 0 && (
                        <div className="flex gap-2">
                          <select
                            onChange={(e) => assignToRider(order.id, e.target.value)}
                            className="text-sm border rounded px-2 py-1"
                            defaultValue=""
                          >
                            <option value="">Assign Rider</option>
                            {availableRiders.map((rider) => (
                              <option key={rider.id} value={rider.id}>
                                {rider.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      {order.status === 'assigned' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'picked_up')}
                          className="flex items-center gap-1"
                        >
                          <Truck className="h-4 w-4" />
                          Mark Picked Up
                        </Button>
                      )}
                      
                      {order.status === 'picked_up' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="flex items-center gap-1"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark Delivered
                        </Button>
                      )}
                    </div>
                    
                    {order.assignedRiderId && (
                      <p className="text-sm text-gray-600">
                        Assigned to: {riders.find(r => r.id === order.assignedRiderId)?.name || 'Unknown Rider'}
                      </p>
                    )}
                  </div>
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
