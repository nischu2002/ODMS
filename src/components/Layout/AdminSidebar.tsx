
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  Truck, 
  ShoppingBag, 
  BarChart3, 
  Settings,
  Activity
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Restaurants', href: '/admin/restaurants', icon: Store },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'All Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Delivery Riders', href: '/admin/riders', icon: Truck },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'System Logs', href: '/admin/logs', icon: Activity },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export const AdminSidebar = () => {
  return (
    <div className="w-64 bg-white border-r border-gray-200">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
        <p className="text-sm text-gray-600">System Management</p>
      </div>
      
      <nav className="px-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
