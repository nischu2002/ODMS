
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ChefHat, 
  Truck, 
  BarChart3, 
  MapPin
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/restaurant', icon: LayoutDashboard },
  { name: 'Orders', href: '/restaurant/orders', icon: ShoppingBag },
  { name: 'Kitchen', href: '/restaurant/kitchen', icon: ChefHat },
  { name: 'Delivery', href: '/restaurant/delivery', icon: Truck },
  { name: 'Track Riders', href: '/restaurant/track', icon: MapPin },
  { name: 'Analytics', href: '/restaurant/analytics', icon: BarChart3 },
];

export const RestaurantSidebar = () => {
  return (
    <div className="w-64 bg-white border-r border-gray-200">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">Restaurant</h2>
        <p className="text-sm text-gray-600">Order Management</p>
      </div>
      
      <nav className="px-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-green-100 text-green-700'
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
