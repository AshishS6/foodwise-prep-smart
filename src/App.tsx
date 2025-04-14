
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import Index from "./pages/Index";
import POS from "./pages/POS";
import Inventory from "./pages/Inventory";
import Recipes from "./pages/Recipes";
import PrepPlans from "./pages/PrepPlans";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import OrderHistory from "./pages/OrderHistory";

const queryClient = new QueryClient();

// Protected route component with role-based access control
const ProtectedRoute = ({ 
  children, 
  allowedRoles = ['Admin', 'Kitchen Staff', 'Cashier'] 
}: { 
  children: JSX.Element, 
  allowedRoles?: string[] 
}) => {
  const { session, loading, userRole } = useAuthStore();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // If roles are specified and user doesn't have an allowed role, restrict access
  if (allowedRoles.length > 0 && userRole && !allowedRoles.includes(userRole)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
        <p className="mb-4">You don't have permission to access this page.</p>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => window.history.back()}
        >
          Go Back
        </button>
      </div>
    );
  }
  
  return children;
};

// QuickActions component to show floating buttons only on Home page
const QuickActions = () => {
  const location = useLocation();
  
  // Only show on the home page
  if (location.pathname !== '/') {
    return null;
  }
  
  // Return null since the floating buttons are now in Index.tsx
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pos" 
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Cashier']}>
                <POS />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/inventory" 
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Kitchen Staff']}>
                <Inventory />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/recipes" 
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Kitchen Staff']}>
                <Recipes />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/prep-plans" 
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Kitchen Staff']}>
                <PrepPlans />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/order-history" 
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Cashier']}>
                <OrderHistory />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                {/* Analytics page placeholder - we'll implement this shortly */}
                <div className="container mx-auto p-6">
                  <h1 className="text-2xl font-bold mb-4">Analytics Coming Soon</h1>
                </div>
              </ProtectedRoute>
            } 
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
