import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Package, BarChart3, Utensils, ChefHat } from 'lucide-react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useCurrentTeamMember } from '@/hooks/useTeamMembers';
import { TOUCH_TARGETS, LAYOUT_DIMENSIONS, ANIMATION_DURATIONS } from '@/constants/mobile';
import { triggerHapticFeedback } from '@/utils/mobileUtils';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  permission?: string;
}

const ROLE_PERMISSIONS = {
  'Admin': ['dashboard', 'pos', 'inventory', 'recipes', 'prepplans', 'orderhistory', 'analytics', 'reports', 'team', 'kitchen'],
  'Kitchen Staff': ['pos', 'inventory', 'recipes', 'prepplans', 'kitchen'],
  'Cashier': ['dashboard', 'pos', 'orderhistory'],
  'Manager': ['dashboard', 'pos', 'inventory', 'recipes', 'prepplans', 'orderhistory', 'analytics', 'reports', 'kitchen']
};

export const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useDeviceDetection();
  const { data: teamMember, isLoading: teamMemberLoading } = useCurrentTeamMember();

  // Don't show on desktop or on auth pages
  if (!isMobile || location.pathname.startsWith('/auth')) {
    return null;
  }

  const userRole = teamMember?.role as keyof typeof ROLE_PERMISSIONS;
  const userPermissions = userRole ? ROLE_PERMISSIONS[userRole] || [] : [];

  const navItems: NavItem[] = [
    { path: '/', icon: <Home className="h-5 w-5" />, label: 'Home', permission: 'dashboard' },
    { path: '/pos', icon: <ShoppingCart className="h-5 w-5" />, label: 'POS', permission: 'pos' },
    { path: '/kitchen-orders', icon: <Utensils className="h-5 w-5" />, label: 'Kitchen', permission: 'kitchen' },
    { path: '/inventory', icon: <Package className="h-5 w-5" />, label: 'Inventory', permission: 'inventory' },
    { path: '/prep', icon: <ChefHat className="h-5 w-5" />, label: 'Prep', permission: 'recipes' }, // Consolidated Recipes and Prep Plans
    { path: '/analytics', icon: <BarChart3 className="h-5 w-5" />, label: 'Analytics', permission: 'analytics' },
  ];

  // Filter items based on user permissions
  // If team member is still loading, show only dashboard (safe default)
  // Otherwise, only show items that the user has permission for
  const visibleItems = teamMemberLoading
    ? navItems.filter(item => item.permission === 'dashboard')
    : navItems.filter(item => {
        // If item has no permission requirement, don't show it (all items should have permissions)
        if (!item.permission) return false;
        // Only show if user has the required permission
        return userPermissions.includes(item.permission);
      });

  const handleNavClick = (path: string) => {
    triggerHapticFeedback('light');
    navigate(path);
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    // Special handling for /prep to match both /recipes and /prep-plans
    if (path === '/prep') {
      return location.pathname.startsWith('/prep') || location.pathname.startsWith('/recipes');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden"
      style={{
        height: `${LAYOUT_DIMENSIONS.BOTTOM_NAV_HEIGHT}px`,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex h-full items-center justify-around px-2">
        {visibleItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full min-h-[44px] transition-all duration-200",
                "active:scale-95",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              style={{
                minHeight: `${TOUCH_TARGETS.MINIMUM}px`,
                transitionDuration: `${ANIMATION_DURATIONS.NORMAL}ms`,
              }}
              aria-label={item.label}
            >
              <div className={cn(
                "transition-transform duration-200",
                active && "scale-110"
              )}>
                {item.icon}
              </div>
              <span className={cn(
                "text-xs font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
              {active && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};


