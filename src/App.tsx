
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Index from "./pages/Index";
import About from "./pages/About";
import Teams from "./pages/Teams";
import Login from "./pages/Login";
import RestaurantSignup from "./pages/RestaurantSignup";
import DomainSetup from "./pages/DomainSetup";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import RiderDashboard from "./pages/RiderDashboard";
import NotFound from "./pages/NotFound";
import { Skeleton } from "./components/ui/skeleton";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  console.log('ProtectedRoute: Calling useAuth');
  const { user, isLoading } = useAuth();
  console.log('ProtectedRoute: useAuth result', { user: !!user, isLoading });
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-12 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
      </div>
    );
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
  console.log('AppRoutes: About to call useAuth');
  const { user, isLoading } = useAuth();
  console.log('AppRoutes: useAuth result', { user: !!user, isLoading });
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-12 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
      </div>
    );
  }
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/about" element={<About />} />
      <Route path="/teams" element={<Teams />} />
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
        path="/restaurant-admin/menu" 
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
        path="/restaurant" 
        element={
          <ProtectedRoute allowedRoles={['restaurant_staff', 'admin']}>
            <RestaurantDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Rider Routes - Fixed routing */}
      <Route 
        path="/rider" 
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
            user.role === 'restaurant_staff' ? <Navigate to="/restaurant" replace /> :
            user.role === 'rider' ? <Navigate to="/rider" replace /> :
            <Navigate to="/login" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      <Route path="/unauthorized" element={
        <div className="min-h-screen flex items-center justify-center">
          <h1 className="text-2xl font-bold text-red-600">Unauthorized Access</h1>
        </div>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  console.log('App: Rendering App component');
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppRoutes />
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
