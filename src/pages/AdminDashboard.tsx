
import React from 'react';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { RestaurantCRUD } from '../components/RestaurantCRUD';
import { Analytics } from '../components/Analytics';
import { CMSManager } from '../components/CMSManager';
import { SystemNotificationsManager } from '../components/SystemNotificationsManager';
import { OrderManagement } from '../components/OrderManagement';
import { CreateOrderForm } from '../components/CreateOrderForm';
import { useLocation } from 'react-router-dom';

export default function AdminDashboard() {
  const location = useLocation();
  const currentTab = new URLSearchParams(location.search).get('tab') || 'overview';

  const renderContent = () => {
    switch (currentTab) {
      case 'restaurants':
        return <RestaurantCRUD />;
      case 'analytics':
        return <Analytics />;
      case 'cms':
        return <CMSManager />;
      case 'notifications':
        return <SystemNotificationsManager />;
      case 'orders':
        return <OrderManagement />;
      case 'create-order':
        return <CreateOrderForm />;
      default:
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Total Restaurants</h3>
                <p className="text-3xl font-bold text-blue-600">12</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Active Orders</h3>
                <p className="text-3xl font-bold text-green-600">85</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
                <p className="text-3xl font-bold text-purple-600">Rs. 45,230</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Delivery Partners</h3>
                <p className="text-3xl font-bold text-orange-600">28</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      {renderContent()}
    </DashboardLayout>
  );
}
