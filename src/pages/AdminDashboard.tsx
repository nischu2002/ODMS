
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { Analytics } from '../components/Analytics';
import { OrderManagement } from '../components/OrderManagement';
import { NotificationCenter } from '../components/NotificationCenter';
import { MenuManagement } from '../components/MenuManagement';
import { StaffManagement } from '../components/StaffManagement';
import { RiderManagement } from '../components/RiderManagement';
import { CreateOrderForm } from '../components/CreateOrderForm';
import { useLocation } from 'react-router-dom';

export default function AdminDashboard() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get('tab') || 'overview';
    setActiveTab(tab);
  }, [location.search]);

  const renderContent = () => {
    switch (activeTab) {
      case 'staff':
        return <StaffManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'menu':
        return <MenuManagement />;
      case 'riders':
        return <RiderManagement />;
      case 'analytics':
        return <Analytics />;
      case 'notifications':
        return <NotificationCenter />;
      case 'create-order':
        return <CreateOrderForm />;
      case 'settings':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Restaurant Settings</h1>
            <p className="text-gray-600">Manage your restaurant settings and preferences.</p>
          </div>
        );
      default:
        return <Analytics />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your restaurant operations and monitor performance.
          </p>
        </div>
        
        {renderContent()}
      </div>
    </DashboardLayout>
  );
}
