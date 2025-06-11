
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { LogOut, User, Bell } from 'lucide-react';

export const DashboardHeader = () => {
  const { user, restaurant, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {restaurant ? restaurant.name : 'ODMS Admin'}
          </h1>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
            {user?.role?.replace('_', ' ')}
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
            <User className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">{user?.name}</span>
          </div>
          
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};
