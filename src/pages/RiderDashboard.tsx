
import React from 'react';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Package, MapPin, Clock, Star, DollarSign, Navigation } from 'lucide-react';

export default function RiderDashboard() {
  const riderStats = [
    {
      title: "Today's Deliveries",
      value: '8',
      change: '+2 from yesterday',
      icon: Package,
      color: 'text-blue-600',
    },
    {
      title: "Today's Earnings",
      value: '$156',
      change: '+$24 from yesterday',
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Average Rating',
      value: '4.9',
      change: 'Based on 245 reviews',
      icon: Star,
      color: 'text-yellow-600',
    },
    {
      title: 'Delivery Time',
      value: '22 min',
      change: 'Average per delivery',
      icon: Clock,
      color: 'text-purple-600',
    },
  ];

  const activeDeliveries = [
    {
      id: 'DEL001',
      restaurant: 'Burger King',
      customer: 'John Doe',
      address: '123 Main St, Apt 4B',
      amount: '$45.50',
      estimatedTime: '15 min',
      status: 'picked_up'
    },
    {
      id: 'DEL002',
      restaurant: 'Pizza Hut',
      customer: 'Jane Smith',
      address: '456 Oak Ave',
      amount: '$32.00',
      estimatedTime: '8 min',
      status: 'assigned'
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rider Dashboard</h1>
            <p className="text-gray-600">Welcome back! You're online and ready for deliveries.</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-700">Online</span>
            </div>
            <Button variant="outline">
              <Navigation className="h-4 w-4 mr-2" />
              Share Location
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {riderStats.map((stat) => (
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
              <CardTitle>Active Deliveries</CardTitle>
              <CardDescription>Your current delivery assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeDeliveries.map((delivery) => (
                  <div key={delivery.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="font-medium text-sm">{delivery.id}</div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          delivery.status === 'picked_up' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {delivery.status === 'picked_up' ? 'On Route' : 'Ready to Pick'}
                        </span>
                      </div>
                      <div className="font-bold text-green-600">{delivery.amount}</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">From: {delivery.restaurant}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">To: {delivery.customer}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">ETA: {delivery.estimatedTime}</span>
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-4">
                      <Button size="sm" className="flex-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        Navigate
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        Contact Customer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today's Performance</CardTitle>
              <CardDescription>Your delivery statistics for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completed Deliveries</span>
                  <span className="font-bold">8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Distance</span>
                  <span className="font-bold">45.2 km</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Online Time</span>
                  <span className="font-bold">6h 32m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Customer Rating</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold">4.9</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-medium">Today's Earnings</span>
                    <span className="font-bold text-green-600">$156.00</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
