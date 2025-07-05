
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  ShoppingBag, 
  BarChart3, 
  Settings,
  Store,
  ChefHat
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/restaurant-admin', icon: LayoutDashboard, tab: 'overview' },
  { name: 'Restaurant Staff', href: '/restaurant-admin/staff', icon: Users, tab: 'staff' },
  { name: 'Orders', href: '/restaurant-admin/orders', icon: ShoppingBag, tab: 'orders' },
  { name: 'Menu Management', href: '/restaurant-admin/menu', icon: ChefHat, tab: 'menu' },
  { name: 'Delivery Riders', href: '/restaurant-admin/riders', icon: Truck, tab: 'riders' },
  { name: 'Analytics', href: '/restaurant-admin/analytics', icon: BarChart3, tab: 'analytics' },
  { name: 'Restaurant Settings', href: '/restaurant-admin/settings', icon: Settings, tab: 'settings' },
];

export const AdminSidebar = () => {
  const location = useLocation();

  // Function to determine which tab should be active based on route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/staff')) return 'staff';
    if (path.includes('/orders')) return 'orders';
    if (path.includes('/menu')) return 'menu';
    if (path.includes('/riders')) return 'riders';
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/settings')) return 'settings';
    return 'overview';
  };

  const handleNavClick = (targetTab: string) => {
    // Store the intended tab in sessionStorage so AdminDashboard can read it
    sessionStorage.setItem('adminDashboardTab', targetTab);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <Store className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Restaurant Admin</h2>
            <p className="text-sm text-gray-600">Management Portal</p>
          </div>
        </div>
      </div>
      
      <nav className="px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = getActiveTab() === item.tab || 
                          (location.pathname === item.href) ||
                          (item.href === '/restaurant-admin' && location.pathname === '/restaurant-admin');
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => handleNavClick(item.tab)}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group ${
                isActive
                  ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'}`} />
              {item.name}
            </NavLink>
          );
        })}
      </nav>
      
      {/* Additional Info Section */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-600">
            <div className="font-medium mb-1">Quick Actions</div>
            <div className="space-y-1">
              <div>• Create new orders</div>
              <div>• Manage staff & riders</div>
              <div>• View analytics</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
