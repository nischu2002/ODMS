
import React from 'react';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { RiderDashboard as RiderDashboardComponent } from '../components/RiderDashboard';

export default function RiderDashboard() {
  return (
    <DashboardLayout>
      <RiderDashboardComponent />
    </DashboardLayout>
  );
}
