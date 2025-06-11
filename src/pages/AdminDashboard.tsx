
import React from 'react';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Store, Users, ShoppingBag, Truck, TrendingUp, DollarSign } from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    {
      title: 'Total Restaurants',
      value: '24',
      change: '+2 this month',
      icon: Store,
      color: 'text-blue-600',
    },
    {
      title: 'Active Users',
      value: '1,432',
      change: '+12% from last month',
      icon: Users,
      color: 'text-green-600',
    },
    {
      title: 'Total Orders',
      value: '8,924',
      change: '+18% from last month',
      icon: ShoppingBag,
      color: 'text-purple-600',
    },
    {
      title: 'Active Riders',
      value: '156',
      change: '+5 new riders',
      icon: Truck,
      color: 'text-orange-600',
    },
    {
      title: 'System Revenue',
      value: '$2,84,392',
      change: '+22% from last month',
      icon: DollarSign,
      color: 'text-emerald-600',
    },
    {
      title: 'Growth Rate',
      value: '23.5%',
      change: '+2.1% from last month',
      icon: TrendingUp,
      color: 'text-indigo-600',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">System Overview</h1>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat) => (
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
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New restaurant registered</p>
                    <p className="text-xs text-gray-500">Pizza Palace - 2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Rider completed delivery</p>
                    <p className="text-xs text-gray-500">Order #1234 - 5 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">System maintenance scheduled</p>
                    <p className="text-xs text-gray-500">Tonight 2:00 AM - 10 minutes ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Restaurants</CardTitle>
              <CardDescription>Based on orders this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Burger King</p>
                    <p className="text-xs text-gray-500">345 orders</p>
                  </div>
                  <div className="text-sm font-bold text-green-600">$12,450</div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Pizza Hut</p>
                    <p className="text-xs text-gray-500">298 orders</p>
                  </div>
                  <div className="text-sm font-bold text-green-600">$9,890</div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">McDonald's</p>
                    <p className="text-xs text-gray-500">276 orders</p>
                  </div>
                  <div className="text-sm font-bold text-green-600">$8,720</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
