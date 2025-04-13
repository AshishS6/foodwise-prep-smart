
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import Index from "./pages/Index";
import POS from "./pages/POS";
import Inventory from "./pages/Inventory";
import Recipes from "./pages/Recipes";
import PrepPlans from "./pages/PrepPlans";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { session, loading } = useAuthStore();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
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
              <ProtectedRoute>
                <POS />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/inventory" 
            element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/recipes" 
            element={
              <ProtectedRoute>
                <Recipes />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/prep-plans" 
            element={
              <ProtectedRoute>
                <PrepPlans />
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
