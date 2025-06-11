
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
      
      {/* Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Restaurant Staff Routes */}
      <Route 
        path="/restaurant" 
        element={
          <ProtectedRoute allowedRoles={['restaurant_staff']}>
            <RestaurantDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Rider Routes */}
      <Route 
        path="/rider" 
        element={
          <ProtectedRoute allowedRoles={['rider']}>
            <RiderDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Redirect based on user role */}
      <Route 
        path="/dashboard" 
        element={
          user ? (
            user.role === 'admin' ? <Navigate to="/admin" replace /> :
            user.role === 'restaurant_staff' ? <Navigate to="/restaurant" replace /> :
            user.role === 'rider' ? <Navigate to="/rider" replace /> :
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
