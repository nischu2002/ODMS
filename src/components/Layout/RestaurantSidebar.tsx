
import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  
  // Create navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/restaurant', icon: LayoutDashboard, tab: null },
      { name: 'Orders', href: '/restaurant?tab=orders', icon: ShoppingBag, tab: 'orders' },
      { name: 'Kitchen', href: '/restaurant?tab=kitchen', icon: ChefHat, tab: 'kitchen' },
      { name: 'Menu', href: '/restaurant?tab=menu', icon: ChefHat, tab: 'menu' },
      { name: 'Create Order', href: '/restaurant?tab=create-order', icon: Plus, tab: 'create-order' },
      { name: 'Analytics', href: '/restaurant?tab=analytics', icon: BarChart3, tab: 'analytics' },
      { name: 'Notifications', href: '/restaurant?tab=notifications', icon: Bell, tab: 'notifications' },
    ];

    // Add admin-only options
    if (user?.role === 'admin') {
      baseItems.push(
        { name: 'Staff Management', href: '/restaurant?tab=staff', icon: Users, tab: 'staff' },
        { name: 'Rider Management', href: '/restaurant?tab=riders', icon: Truck, tab: 'riders' }
      );
    }

    return baseItems;
  };

  const navigation = getNavigationItems();

  const isActiveLink = (item: { href: string; tab: string | null }) => {
    if (item.tab === null) {
      return location.pathname === '/restaurant' && !location.search;
    }
    return location.search.includes(`tab=${item.tab}`);
  };

  const handleNavigation = (item: { href: string; tab: string | null }) => {
    navigate(item.href);
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
          <button
            key={item.name}
            onClick={() => handleNavigation(item)}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActiveLink(item)
                ? 'bg-green-100 text-green-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </button>
        ))}
      </nav>
    </div>
  );
};
