
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import RestaurantSignup from "./pages/RestaurantSignup";
import DomainSetup from "./pages/DomainSetup";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import RiderDashboard from "./pages/RiderDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<RestaurantSignup />} />
      <Route path="/setup/:domain" element={<DomainSetup />} />
      <Route path="/admin" element={<SuperAdminLogin />} />
      
      {/* Super Admin Routes */}
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Restaurant Admin Routes */}
      <Route 
        path="/restaurant-admin" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/restaurant-admin/staff" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/restaurant-admin/orders" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/restaurant-admin/riders" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/restaurant-admin/analytics" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/restaurant-admin/settings" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Restaurant Staff Routes */}
      <Route 
        path="/staff-dashboard" 
        element={
          <ProtectedRoute allowedRoles={['restaurant_staff']}>
            <RestaurantDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Rider Routes */}
      <Route 
        path="/rider-dashboard" 
        element={
          <ProtectedRoute allowedRoles={['rider']}>
            <RiderDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Main Dashboard Route - Redirects based on user role */}
      <Route 
        path="/dashboard" 
        element={
          user ? (
            user.role === 'super_admin' ? <Navigate to="/admin/dashboard" replace /> :
            user.role === 'admin' ? <Navigate to="/restaurant-admin" replace /> :
            user.role === 'restaurant_staff' ? <Navigate to="/staff-dashboard" replace /> :
            user.role === 'rider' ? <Navigate to="/rider-dashboard" replace /> :
            <Navigate to="/login" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      <Route path="/unauthorized" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl font-bold text-red-600">Unauthorized Access</h1></div>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
