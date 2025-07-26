
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ChefHat, 
  Truck, 
  BarChart3, 
  MapPin,
  Users,
  Bell,
  Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const RestaurantSidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Create navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/restaurant', icon: LayoutDashboard },
      { name: 'Orders', href: '/restaurant?tab=orders', icon: ShoppingBag },
      { name: 'Kitchen', href: '/restaurant?tab=kitchen', icon: ChefHat },
      { name: 'Menu', href: '/restaurant?tab=menu', icon: ChefHat },
      { name: 'Create Order', href: '/restaurant?tab=create-order', icon: Plus },
      { name: 'Analytics', href: '/restaurant?tab=analytics', icon: BarChart3 },
      { name: 'Notifications', href: '/restaurant?tab=notifications', icon: Bell },
    ];

    // Add admin-only options
    if (user?.role === 'admin') {
      baseItems.push(
        { name: 'Staff Management', href: '/restaurant?tab=staff', icon: Users },
        { name: 'Rider Management', href: '/restaurant?tab=riders', icon: Truck },
        { name: 'Track Riders', href: '/restaurant/track', icon: MapPin }
      );
    }

    return baseItems;
  };

  const navigation = getNavigationItems();

  const isActiveLink = (href: string) => {
    if (href === '/restaurant') {
      return location.pathname === '/restaurant' && !location.search;
    }
    if (href.includes('tab=')) {
      const tabParam = href.split('tab=')[1];
      return location.search.includes(`tab=${tabParam}`);
    }
    return location.pathname === href;
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">Restaurant</h2>
        <p className="text-sm text-gray-600">
          {user?.role === 'admin' ? 'Admin Panel' : 'Staff Panel'}
        </p>
      </div>
      
      <nav className="px-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActiveLink(item.href)
                ? 'bg-green-100 text-green-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
