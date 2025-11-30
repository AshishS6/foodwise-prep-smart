
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MobileLayoutProvider, useMobileLayout } from "@/contexts/MobileLayoutContext";
import { useCurrentTeamMember } from "@/hooks/useTeamMembers";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ResponsiveSidebar } from "@/components/layout/ResponsiveSidebar";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { Suspense, lazy } from "react";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const POS = lazy(() => import("./pages/POS"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Recipes = lazy(() => import("./pages/Recipes"));
const PrepPlans = lazy(() => import("./pages/PrepPlans"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const Analytics = lazy(() => import("./pages/Analytics"));
const TeamManagement = lazy(() => import("./pages/TeamManagement"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Test = lazy(() => import("./pages/Test"));
const KitchenOrders = lazy(() => import("./pages/KitchenOrders"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

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
  'Admin': ['dashboard', 'pos', 'inventory', 'recipes', 'prepplans', 'orderhistory', 'analytics', 'reports', 'team', 'kitchen'],
  'Kitchen Staff': ['dashboard', 'inventory', 'recipes', 'prepplans', 'kitchen'],
  'Cashier': ['dashboard', 'pos', 'orderhistory'],
  'Manager': ['dashboard', 'pos', 'inventory', 'recipes', 'prepplans', 'orderhistory', 'analytics', 'reports', 'kitchen']
};

// Protected route component with role-based access control
const ProtectedRoute = ({ 
  children, 
  requiredPermission
}: { 
  children: JSX.Element, 
  requiredPermission: string
}) => {
  const { user, loading, signOut } = useAuth();
  const { data: teamMember, loading: teamLoading } = useCurrentTeamMember();
  const navigate = useNavigate();
  
  if (loading || teamLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Special case for specific email - always allow access
  const userEmail = user?.email;
  if (userEmail === 'ashishsasikumar@gmail.com') {
    return children;
  }

  // Check if user's role has the required permission
  const userRole = teamMember?.role;
  
  // If no team member record exists, show invitation required message
  if (!teamMember && user && user.email) {
    console.log('No team member record found for user:', user.email);
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Invitation Required</h1>
        <p className="mb-4">You need to be invited by an administrator to access this system.</p>
        <p className="mb-4 text-sm text-muted-foreground">User: {user.email}</p>
        <div className="space-y-2">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => navigate('/auth')}
          >
            Back to Sign In
          </button>
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 ml-2"
            onClick={async () => {
              await signOut();
              navigate('/auth');
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }
  
  const userPermissions = userRole ? ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS] || [] : [];
  if (!userPermissions.includes(requiredPermission)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
        <p className="mb-4">You don't have permission to access this page.</p>
        <p className="mb-4 text-sm text-muted-foreground">
          User: {user.email} | Role: {userRole || 'No role assigned'}
        </p>
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

const AppContent = () => {
  const { isMobileLayout, showBottomNav } = useMobileLayout();
  const { isMobile } = useDeviceDetection();
  const location = useLocation();

  // Hide bottom nav on auth pages
  const shouldShowBottomNav = showBottomNav && isMobile && !location.pathname.startsWith('/auth');

  // Don't show sidebar on auth pages
  const isAuthPage = location.pathname.startsWith('/auth');
  
  return (
    <>
      {!isMobile && !isAuthPage && (
        <ResponsiveSidebar>
          <Routes>
            <Route path="/test" element={<Test />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute requiredPermission="dashboard">
                  <Suspense fallback={<LoadingFallback />}>
                    <Index />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/pos" 
              element={
                <ProtectedRoute requiredPermission="pos">
                  <Suspense fallback={<LoadingFallback />}>
                    <POS />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/inventory" 
              element={
                <ProtectedRoute requiredPermission="inventory">
                  <Suspense fallback={<LoadingFallback />}>
                    <Inventory />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/recipes" 
              element={
                <ProtectedRoute requiredPermission="recipes">
                  <Suspense fallback={<LoadingFallback />}>
                    <Recipes />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/prep-plans" 
              element={
                <ProtectedRoute requiredPermission="prepplans">
                  <Suspense fallback={<LoadingFallback />}>
                    <PrepPlans />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/order-history" 
              element={
                <ProtectedRoute requiredPermission="orderhistory">
                  <Suspense fallback={<LoadingFallback />}>
                    <OrderHistory />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/kitchen-orders" 
              element={
                <ProtectedRoute requiredPermission="kitchen">
                  <Suspense fallback={<LoadingFallback />}>
                    <KitchenOrders />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/analytics"
              element={
                <ProtectedRoute requiredPermission="analytics">
                  <Suspense fallback={<LoadingFallback />}>
                    <Analytics />
                  </Suspense>
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
            <Route 
              path="/team-management" 
              element={
                <ProtectedRoute requiredPermission="team">
                  <Suspense fallback={<LoadingFallback />}>
                    <TeamManagement />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute requiredPermission="dashboard">
                  <Suspense fallback={<LoadingFallback />}>
                    <Profile />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute requiredPermission="dashboard">
                  <Suspense fallback={<LoadingFallback />}>
                    <Settings />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/test" 
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <Test />
                </Suspense>
              } 
            />
            <Route 
              path="/auth" 
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <Auth />
                </Suspense>
              } 
            />
            <Route 
              path="/auth/callback" 
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <AuthCallback />
                </Suspense>
              } 
            />
            {/* Catch-all route */}
            <Route path="*" element={
              <Suspense fallback={<LoadingFallback />}>
                <NotFound />
              </Suspense>
            } />
          </Routes>
        </ResponsiveSidebar>
      )}
      {!isMobile && isAuthPage && (
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      )}
      {isMobile && (
        <Routes>
            <Route 
              path="/" 
              element={
                <ProtectedRoute requiredPermission="dashboard">
                  <Suspense fallback={<LoadingFallback />}>
                    <Index />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/pos" 
              element={
                <ProtectedRoute requiredPermission="pos">
                  <Suspense fallback={<LoadingFallback />}>
                    <POS />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/inventory" 
              element={
                <ProtectedRoute requiredPermission="inventory">
                  <Suspense fallback={<LoadingFallback />}>
                    <Inventory />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/recipes" 
              element={
                <ProtectedRoute requiredPermission="recipes">
                  <Suspense fallback={<LoadingFallback />}>
                    <Recipes />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/prep-plans" 
              element={
                <ProtectedRoute requiredPermission="prepplans">
                  <Suspense fallback={<LoadingFallback />}>
                    <PrepPlans />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/order-history" 
              element={
                <ProtectedRoute requiredPermission="orderhistory">
                  <Suspense fallback={<LoadingFallback />}>
                    <OrderHistory />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/kitchen-orders" 
              element={
                <ProtectedRoute requiredPermission="kitchen">
                  <Suspense fallback={<LoadingFallback />}>
                    <KitchenOrders />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/analytics"
              element={
                <ProtectedRoute requiredPermission="analytics">
                  <Suspense fallback={<LoadingFallback />}>
                    <Analytics />
                  </Suspense>
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
            <Route 
              path="/team-management" 
              element={
                <ProtectedRoute requiredPermission="team">
                  <Suspense fallback={<LoadingFallback />}>
                    <TeamManagement />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute requiredPermission="dashboard">
                  <Suspense fallback={<LoadingFallback />}>
                    <Profile />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute requiredPermission="dashboard">
                  <Suspense fallback={<LoadingFallback />}>
                    <Settings />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/test" 
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <Test />
                </Suspense>
              } 
            />
            <Route 
              path="/auth" 
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <Auth />
                </Suspense>
              } 
            />
            <Route 
              path="/auth/callback" 
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <AuthCallback />
                </Suspense>
              } 
            />
            {/* Catch-all route */}
            <Route path="*" element={
              <Suspense fallback={<LoadingFallback />}>
                <NotFound />
              </Suspense>
            } />
          </Routes>
      )}
      {shouldShowBottomNav && <MobileBottomNav />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <MobileLayoutProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </MobileLayoutProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
