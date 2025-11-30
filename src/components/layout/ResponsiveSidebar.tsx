import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useCurrentTeamMember } from '@/hooks/useTeamMembers';
import { triggerHapticFeedback } from '@/utils/mobileUtils';
import {
  Home,
  ShoppingCart,
  Package,
  ScrollText,
  ChefHat,
  BarChart3,
  Users,
  Settings,
  FileText,
  Utensils,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLE_PERMISSIONS = {
  'Admin': ['dashboard', 'pos', 'inventory', 'recipes', 'prepplans', 'orderhistory', 'analytics', 'reports', 'team', 'kitchen'],
  'Kitchen Staff': ['pos', 'inventory', 'recipes', 'prepplans', 'kitchen'],
  'Cashier': ['dashboard', 'pos', 'orderhistory'],
  'Manager': ['dashboard', 'pos', 'inventory', 'recipes', 'prepplans', 'orderhistory', 'analytics', 'reports', 'kitchen']
};

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  path: string;
  permission?: string;
}

const menuItems: MenuItem[] = [
  { title: 'Dashboard', icon: <Home className="h-4 w-4" />, path: '/', permission: 'dashboard' },
  { title: 'POS', icon: <ShoppingCart className="h-4 w-4" />, path: '/pos', permission: 'pos' },
  { title: 'Kitchen Orders', icon: <Utensils className="h-4 w-4" />, path: '/kitchen-orders', permission: 'kitchen' },
  { title: 'Inventory', icon: <Package className="h-4 w-4" />, path: '/inventory', permission: 'inventory' },
  { title: 'Recipes', icon: <ScrollText className="h-4 w-4" />, path: '/recipes', permission: 'recipes' },
  { title: 'Prep Plans', icon: <ChefHat className="h-4 w-4" />, path: '/prep-plans', permission: 'prepplans' },
  { title: 'Order History', icon: <FileText className="h-4 w-4" />, path: '/order-history', permission: 'orderhistory' },
  { title: 'Analytics', icon: <BarChart3 className="h-4 w-4" />, path: '/analytics', permission: 'analytics' },
  { title: 'Team Management', icon: <Users className="h-4 w-4" />, path: '/team-management', permission: 'team' },
  { title: 'Settings', icon: <Settings className="h-4 w-4" />, path: '/settings', permission: 'dashboard' },
];

export const ResponsiveSidebarContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: teamMember, isLoading: teamMemberLoading } = useCurrentTeamMember();
  const { isMobile, touchSupported } = useDeviceDetection();
  const { setOpenMobile } = useSidebar();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Get user role and permissions
  const userRole = teamMember?.role as keyof typeof ROLE_PERMISSIONS;
  const userPermissions = userRole && ROLE_PERMISSIONS[userRole] 
    ? ROLE_PERMISSIONS[userRole] 
    : [];

  // Filter menu items based on permissions
  // If team member is still loading, show only dashboard (safe default)
  // Otherwise, only show items that the user has permission for
  const visibleItems = teamMemberLoading 
    ? menuItems.filter(item => item.permission === 'dashboard')
    : menuItems.filter(item => {
        // If item has no permission requirement, don't show it (all items should have permissions)
        if (!item.permission) return false;
        // Only show if user has the required permission
        return userPermissions.includes(item.permission);
      });

  const handleItemClick = (path: string) => {
    if (isMobile && touchSupported) {
      triggerHapticFeedback('light');
    }
    navigate(path);
    // Close sidebar on mobile after navigation
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Gesture-based swipe controls for mobile
  useEffect(() => {
    if (!isMobile || !touchSupported || !sidebarRef.current) return;

    const sidebar = sidebarRef.current;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleSwipe();
    };

    const handleSwipe = () => {
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Check if horizontal swipe is more significant than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        // Swipe left to close
        if (deltaX < 0) {
          setOpenMobile(false);
        }
      }
    };

    sidebar.addEventListener('touchstart', handleTouchStart);
    sidebar.addEventListener('touchend', handleTouchEnd);

    return () => {
      sidebar.removeEventListener('touchstart', handleTouchStart);
      sidebar.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, touchSupported, setOpenMobile]);

  return (
    <SidebarContent ref={sidebarRef}>
      <SidebarGroup>
        <SidebarGroupLabel>Navigation</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {visibleItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));
              
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    onClick={() => handleItemClick(item.path)}
                    isActive={isActive}
                    className={cn(
                      "w-full justify-start",
                      isActive && "bg-sidebar-accent"
                    )}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
};

export const ResponsiveSidebar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isMobile } = useDeviceDetection();

  if (isMobile) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar>
        <ResponsiveSidebarContent />
      </Sidebar>
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
};

