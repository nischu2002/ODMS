
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  MapPin, 
  Clock, 
  User
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/rider', icon: LayoutDashboard },
  { name: 'My Deliveries', href: '/rider/deliveries', icon: Package },
  { name: 'Live Tracking', href: '/rider/tracking', icon: MapPin },
  { name: 'History', href: '/rider/history', icon: Clock },
  { name: 'Profile', href: '/rider/profile', icon: User },
];

export const RiderSidebar = () => {
  return (
    <div className="w-64 bg-white border-r border-gray-200">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">Delivery Rider</h2>
        <p className="text-sm text-gray-600">Delivery Management</p>
      </div>
      
      <nav className="px-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-orange-100 text-orange-700'
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
