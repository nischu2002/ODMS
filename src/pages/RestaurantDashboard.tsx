
import React from 'react';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { StaffDashboard } from '../components/StaffDashboard';

export default function RestaurantDashboard() {
  return (
    <DashboardLayout>
      <StaffDashboard />
    </DashboardLayout>
  );
}
