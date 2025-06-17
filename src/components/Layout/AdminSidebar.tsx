
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  ShoppingBag, 
  BarChart3, 
  Settings,
  Store
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/restaurant-admin', icon: LayoutDashboard },
  { name: 'Restaurant Staff', href: '/restaurant-admin/staff', icon: Users },
  { name: 'Orders', href: '/restaurant-admin/orders', icon: ShoppingBag },
  { name: 'Delivery Riders', href: '/restaurant-admin/riders', icon: Truck },
  { name: 'Analytics', href: '/restaurant-admin/analytics', icon: BarChart3 },
  { name: 'Restaurant Settings', href: '/restaurant-admin/settings', icon: Settings },
];

export const AdminSidebar = () => {
  const location = useLocation();

  // Function to determine which tab should be active based on route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/staff')) return 'staff';
    if (path.includes('/orders')) return 'orders';
    if (path.includes('/riders')) return 'riders';
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/settings')) return 'settings';
    return 'overview';
  };

  const handleNavClick = (href: string) => {
    // Store the intended tab in sessionStorage so AdminDashboard can read it
    const tabMap: { [key: string]: string } = {
      '/restaurant-admin': 'overview',
      '/restaurant-admin/staff': 'staff',
      '/restaurant-admin/orders': 'orders',
      '/restaurant-admin/riders': 'riders',
      '/restaurant-admin/analytics': 'analytics',
      '/restaurant-admin/settings': 'settings'
    };
    
    const targetTab = tabMap[href] || 'overview';
    sessionStorage.setItem('adminDashboardTab', targetTab);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <Store className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Restaurant Admin</h2>
            <p className="text-sm text-gray-600">Management</p>
          </div>
        </div>
      </div>
      
      <nav className="px-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={() => handleNavClick(item.href)}
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
