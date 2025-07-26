
import React from 'react';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { RiderDashboard as RiderDashboardComponent } from '../components/RiderDashboard';
import { NotificationPopup } from '../components/NotificationPopup';

export default function RiderDashboard() {
  return (
    <DashboardLayout>
      <RiderDashboardComponent />
      <NotificationPopup />
    </DashboardLayout>
  );
}
