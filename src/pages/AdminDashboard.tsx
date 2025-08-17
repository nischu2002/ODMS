
import React, { useState } from 'react';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { OrderManagement } from '../components/OrderManagement';
import { CreateOrderForm } from '../components/CreateOrderForm';
import { StaffManagement } from '../components/StaffManagement';
import { RiderManagement } from '../components/RiderManagement';
import { MenuManagement } from '../components/MenuManagement';
import { Analytics } from '../components/Analytics';
import { NotificationCenter } from '../components/NotificationCenter';
import { NotificationPopup } from '../components/NotificationPopup';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { restaurant } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening at {restaurant?.name}.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="create-order">Create Order</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="riders">Riders</TabsTrigger>
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Analytics />
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="create-order" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create New Order</CardTitle>
                <CardDescription>Add a new order to the system</CardDescription>
              </CardHeader>
              <CardContent>
                <CreateOrderForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="space-y-4">
            <StaffManagement />
          </TabsContent>

          <TabsContent value="riders" className="space-y-4">
            <RiderManagement />
          </TabsContent>

          <TabsContent value="menu" className="space-y-4">
            <MenuManagement />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <NotificationCenter />
          </TabsContent>
        </Tabs>
      </div>
      <NotificationPopup />
    </DashboardLayout>
  );
}
