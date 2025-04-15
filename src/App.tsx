
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
import Analytics from "./pages/Analytics";

// Create a new QueryClient with specific configuration for better debugging
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Define role-based permissions
const ROLE_PERMISSIONS = {
  'Admin': ['dashboard', 'pos', 'inventory', 'recipes', 'prepplans', 'orderhistory', 'analytics', 'reports'],
  'Kitchen Staff': ['dashboard', 'inventory', 'recipes', 'prepplans'],
  'Cashier': ['dashboard', 'pos', 'orderhistory'],
  'Manager': ['dashboard', 'pos', 'inventory', 'recipes', 'prepplans', 'orderhistory', 'analytics', 'reports']
};

// Protected route component with role-based access control
const ProtectedRoute = ({ 
  children, 
  requiredPermission
}: { 
  children: JSX.Element, 
  requiredPermission: string
}) => {
  const { session, loading, userRole } = useAuthStore();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // Special case for ashishsasikumar@gmail.com - always allow access
  const userEmail = session?.user?.email;
  if (userEmail === 'ashishsasikumar@gmail.com') {
    return children;
  }

  // Check if user's role has the required permission
  const userPermissions = userRole ? ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS] || [] : [];
  if (!userPermissions.includes(requiredPermission)) {
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
              <ProtectedRoute requiredPermission="dashboard">
                <Index />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pos" 
            element={
              <ProtectedRoute requiredPermission="pos">
                <POS />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/inventory" 
            element={
              <ProtectedRoute requiredPermission="inventory">
                <Inventory />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/recipes" 
            element={
              <ProtectedRoute requiredPermission="recipes">
                <Recipes />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/prep-plans" 
            element={
              <ProtectedRoute requiredPermission="prepplans">
                <PrepPlans />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/order-history" 
            element={
              <ProtectedRoute requiredPermission="orderhistory">
                <OrderHistory />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute requiredPermission="analytics">
                <Analytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute requiredPermission="reports">
                <div className="container mx-auto p-6">
                  <h1 className="text-2xl font-bold mb-4">Daily Reports Coming Soon</h1>
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
