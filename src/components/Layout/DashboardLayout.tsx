
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminSidebar } from './AdminSidebar';
import { RestaurantSidebar } from './RestaurantSidebar';
import { RiderSidebar } from './RiderSidebar';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { DashboardHeader } from './DashboardHeader';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const DashboardLayout = ({ children, title = "Dashboard" }: DashboardLayoutProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const getSidebar = () => {
    switch (user?.role) {
      case 'super_admin':
        return <SuperAdminSidebar />;
      case 'admin':
        return <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />;
      case 'restaurant_staff':
        return <RestaurantSidebar />;
      case 'rider':
        return <RiderSidebar />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {getSidebar()}
      <div className="flex-1 flex flex-col">
        <DashboardHeader title={title} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
