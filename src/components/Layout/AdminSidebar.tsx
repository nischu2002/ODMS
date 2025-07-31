
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  ShoppingBag, 
  BarChart3, 
  Settings,
  ChefHat
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/restaurant-admin', icon: LayoutDashboard, tab: 'overview' },
  { name: 'Restaurant Staff', href: '/restaurant-admin?tab=staff', icon: Users, tab: 'staff' },
  { name: 'Orders', href: '/restaurant-admin?tab=orders', icon: ShoppingBag, tab: 'orders' },
  { name: 'Menu Management', href: '/restaurant-admin?tab=menu', icon: ChefHat, tab: 'menu' },
  { name: 'Delivery Riders', href: '/restaurant-admin?tab=riders', icon: Truck, tab: 'riders' },
  { name: 'Analytics', href: '/restaurant-admin?tab=analytics', icon: BarChart3, tab: 'analytics' },
  { name: 'Restaurant Settings', href: '/restaurant-admin?tab=settings', icon: Settings, tab: 'settings' },
];

export const AdminSidebar = () => {
  const location = useLocation();

  const getActiveTab = () => {
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get('tab');
    return tab || 'overview';
  };

  const isActiveLink = (item: { href: string; tab: string }) => {
    const currentTab = getActiveTab();
    return currentTab === item.tab;
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <img 
            src="/lovable-uploads/a42ffb66-427c-426e-9a33-2ff9b05ee0b3.png" 
            alt="ODMS Logo" 
            className="w-8 h-8 rounded-lg"
          />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Restaurant Admin</h2>
            <p className="text-sm text-gray-600">Management Portal</p>
          </div>
        </div>
      </div>
      
      <nav className="px-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group ${
              isActiveLink(item)
                ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <item.icon className={`mr-3 h-5 w-5 ${isActiveLink(item) ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'}`} />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
