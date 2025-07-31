
import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  MapPin, 
  Clock, 
  User,
  Bell
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { Badge } from '../ui/badge';

const navigation = [
  { name: 'Dashboard', href: '/rider', icon: LayoutDashboard, tab: 'dashboard' },
  { name: 'My Deliveries', href: '/rider?tab=deliveries', icon: Package, tab: 'deliveries' },
  { name: 'Live Tracking', href: '/rider?tab=location', icon: MapPin, tab: 'location' },
  { name: 'History', href: '/rider?tab=history', icon: Clock, tab: 'history' },
  { name: 'Notifications', href: '/rider?tab=notifications', icon: Bell, tab: 'notifications' },
  { name: 'Profile', href: '/rider?tab=profile', icon: User, tab: 'profile' },
];

export const RiderSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pendingNotifications } = useNotifications();
  
  const currentTab = new URLSearchParams(location.search).get('tab') || 'dashboard';

  const handleNavClick = (item: any) => {
    if (item.tab === 'dashboard') {
      navigate('/rider');
    } else {
      navigate(`/rider?tab=${item.tab}`);
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">Delivery Rider</h2>
        <p className="text-sm text-gray-600">Delivery Management</p>
      </div>
      
      <nav className="px-4 space-y-1">
        {navigation.map((item) => (
          <button
            key={item.name}
            onClick={() => handleNavClick(item)}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              currentTab === item.tab
                ? 'bg-orange-100 text-orange-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
            {item.name === 'Notifications' && pendingNotifications.length > 0 && (
              <Badge className="ml-auto bg-red-500 text-white">
                {pendingNotifications.length}
              </Badge>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};
