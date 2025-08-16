
import React from 'react';
import { Button } from '../ui/button';
import { LogOut, User, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationPopup } from '../NotificationPopup';

interface DashboardHeaderProps {
  title: string;
}

export const DashboardHeader = ({ title }: DashboardHeaderProps) => {
  const { user, restaurant, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8">
            <img 
              src="/lovable-uploads/a42ffb66-427c-426e-9a33-2ff9b05ee0b3.png" 
              alt="ODMS Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {restaurant && (
              <p className="text-sm text-gray-600">{restaurant.name}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <NotificationPopup />
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>{user?.name}</span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
          
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};
