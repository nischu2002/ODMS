
import React from 'react';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { RiderDashboard as RiderDashboardComponent } from '../components/RiderDashboard';
import { CashCollection } from '../components/CashCollection';
import { NotificationPopup } from '../components/NotificationPopup';
import { useLocation } from 'react-router-dom';

export default function RiderDashboard() {
  const location = useLocation();
  const currentTab = new URLSearchParams(location.search).get('tab') || 'dashboard';

  const renderContent = () => {
    switch (currentTab) {
      case 'cash':
        return <CashCollection />;
      default:
        return <RiderDashboardComponent />;
    }
  };

  return (
    <DashboardLayout>
      {renderContent()}
      <NotificationPopup />
    </DashboardLayout>
  );
}
