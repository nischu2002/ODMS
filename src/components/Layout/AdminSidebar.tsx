
import React from 'react';
import { Button } from '../ui/button';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Truck, 
  BarChart3, 
  Settings,
  ChefHat,
  Bell
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const AdminSidebar = ({ activeTab, onTabChange }: AdminSidebarProps) => {
  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: 'New' },
    { id: 'menu', label: 'Menu Management', icon: ChefHat },
    { id: 'staff', label: 'Staff Management', icon: Users },
    { id: 'riders', label: 'Rider Management', icon: Truck },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8">
            <img 
              src="/lovable-uploads/a42ffb66-427c-426e-9a33-2ff9b05ee0b3.png" 
              alt="ODMS Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-xl font-bold text-gray-900">ODMS</span>
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => onTabChange(item.id)}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.label}
                {item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
