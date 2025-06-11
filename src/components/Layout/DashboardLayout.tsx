
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminSidebar } from './AdminSidebar';
import { RestaurantSidebar } from './RestaurantSidebar';
import { RiderSidebar } from './RiderSidebar';
import { DashboardHeader } from './DashboardHeader';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user } = useAuth();

  const getSidebar = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminSidebar />;
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
        <DashboardHeader />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
