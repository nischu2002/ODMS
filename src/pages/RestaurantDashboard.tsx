
import React from 'react';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ShoppingBag, ChefHat, Truck, Clock, DollarSign, Users } from 'lucide-react';

export default function RestaurantDashboard() {
  const todayStats = [
    {
      title: "Today's Orders",
      value: '42',
      change: '+8 from yesterday',
      icon: ShoppingBag,
      color: 'text-blue-600',
    },
    {
      title: "Today's Revenue",
      value: '$1,280',
      change: '+15% from yesterday',
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Orders in Kitchen',
      value: '7',
      change: 'Average prep: 12 min',
      icon: ChefHat,
      color: 'text-orange-600',
    },
    {
      title: 'Out for Delivery',
      value: '5',
      change: '3 riders active',
      icon: Truck,
      color: 'text-purple-600',
    },
    {
      title: 'Avg Delivery Time',
      value: '28 min',
      change: '-3 min from yesterday',
      icon: Clock,
      color: 'text-indigo-600',
    },
    {
      title: 'Customer Rating',
      value: '4.8',
      change: '+0.2 from last week',
      icon: Users,
      color: 'text-emerald-600',
    },
  ];

  const recentOrders = [
    { id: 'ORD001', customer: 'John Doe', items: 3, amount: '$45.50', status: 'preparing', time: '2 min ago' },
    { id: 'ORD002', customer: 'Jane Smith', items: 2, amount: '$32.00', status: 'ready', time: '5 min ago' },
    { id: 'ORD003', customer: 'Mike Johnson', items: 4, amount: '$68.75', status: 'delivered', time: '12 min ago' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Restaurant Dashboard</h1>
          <div className="flex space-x-3">
            <Button>New Order</Button>
            <Button variant="outline">View Kitchen</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {todayStats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders from customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{order.id}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'ready' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{order.customer}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">{order.items} items • {order.time}</span>
                        <span className="font-medium text-sm">{order.amount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your restaurant operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <ShoppingBag className="h-6 w-6 mb-2" />
                  <span className="text-sm">New Order</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <ChefHat className="h-6 w-6 mb-2" />
                  <span className="text-sm">Kitchen View</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Truck className="h-6 w-6 mb-2" />
                  <span className="text-sm">Assign Delivery</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Users className="h-6 w-6 mb-2" />
                  <span className="text-sm">Manage Riders</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
