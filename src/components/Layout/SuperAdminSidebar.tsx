
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  BarChart3, 
  Settings,
  Shield,
  Globe,
  Bell,
  UserPlus,
  FileText
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Restaurants', href: '/admin/dashboard?tab=restaurants', icon: Store },
  { name: 'Restaurant Admins', href: '/admin/dashboard?tab=admins', icon: Users },
  { name: 'Restaurant Requests', href: '/admin/dashboard?tab=requests', icon: UserPlus },
  { name: 'System Analytics', href: '/admin/dashboard?tab=analytics', icon: BarChart3 },
  { name: 'CMS Management', href: '/admin/dashboard?tab=cms', icon: Globe },
  { name: 'System Notifications', href: '/admin/dashboard?tab=notifications', icon: Bell },
  { name: 'System Settings', href: '/admin/dashboard?tab=settings', icon: Settings },
];

export const SuperAdminSidebar = () => {
  return (
    <div className="w-64 bg-white border-r border-gray-200">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-red-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Super Admin</h2>
            <p className="text-sm text-gray-600">System Control</p>
          </div>
        </div>
      </div>
      
      <nav className="px-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-red-100 text-red-700'
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
