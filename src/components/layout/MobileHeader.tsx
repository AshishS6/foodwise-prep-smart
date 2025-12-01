import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { LAYOUT_DIMENSIONS, TOUCH_TARGETS } from '@/constants/mobile';
import { UserMenu } from '@/components/ui/UserMenu';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; path?: string }>;
}

// Route breadcrumb mapping
const getBreadcrumbs = (pathname: string): Array<{ label: string; path?: string }> => {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs: Array<{ label: string; path?: string }> = [{ label: 'Home', path: '/' }];

  if (paths.length === 0) return breadcrumbs;

  const routeMap: Record<string, string> = {
    'pos': 'POS',
    'inventory': 'Inventory',
    'recipes': 'Recipes',
    'prep-plans': 'Prep Plans',
    'order-history': 'Order History',
    'analytics': 'Analytics',
    'team-management': 'Team Management',
    'profile': 'Profile',
  };

  let currentPath = '';
  paths.forEach((path, index) => {
    currentPath += `/${path}`;
    const label = routeMap[path] || path.charAt(0).toUpperCase() + path.slice(1);
    breadcrumbs.push({
      label,
      path: index === paths.length - 1 ? undefined : currentPath,
    });
  });

  return breadcrumbs;
};

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  subtitle,
  showBack = true,
  actions,
  breadcrumbs,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useDeviceDetection();

  // Don't show on desktop
  if (!isMobile) {
    return null;
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const displayBreadcrumbs = breadcrumbs || getBreadcrumbs(location.pathname);
  const displayTitle = title || displayBreadcrumbs[displayBreadcrumbs.length - 1]?.label || 'Payasakkada';

  return (
    <header
      className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden"
      style={{
        height: `${LAYOUT_DIMENSIONS.MOBILE_HEADER_HEIGHT}px`,
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="shrink-0"
              style={{
                minWidth: `${TOUCH_TARGETS.MINIMUM}px`,
                minHeight: `${TOUCH_TARGETS.MINIMUM}px`,
              }}
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          <div className="flex flex-col min-w-0 flex-1">
            {displayBreadcrumbs.length > 1 && (
              <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                {displayBreadcrumbs.slice(0, -1).map((crumb, index) => (
                  <React.Fragment key={index}>
                    {crumb.path ? (
                      <button
                        onClick={() => crumb.path && navigate(crumb.path)}
                        className="hover:text-foreground transition-colors truncate max-w-[80px]"
                      >
                        {crumb.label}
                      </button>
                    ) : (
                      <span className="truncate max-w-[80px]">{crumb.label}</span>
                    )}
                    {index < displayBreadcrumbs.length - 2 && <span>/</span>}
                  </React.Fragment>
                ))}
              </nav>
            )}
            <h1 className="text-lg font-semibold truncate">
              {displayTitle}
            </h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {actions}
          <UserMenu />
        </div>
      </div>
    </header>
  );
};


