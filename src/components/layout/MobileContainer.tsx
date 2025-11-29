import React from 'react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { MOBILE_SPACING, LAYOUT_DIMENSIONS } from '@/constants/mobile';
import { cn } from '@/lib/utils';

interface MobileContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  fullHeight?: boolean;
  safeArea?: boolean;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({
  children,
  fullHeight = false,
  safeArea = true,
  className,
  ...props
}) => {
  const { isMobile, isTablet } = useDeviceDetection();

  const padding = isMobile 
    ? MOBILE_SPACING.MD 
    : isTablet 
    ? MOBILE_SPACING.LG 
    : MOBILE_SPACING.XL;

  return (
    <div
      className={cn(
        "w-full mx-auto",
        fullHeight && "min-h-screen",
        className
      )}
      style={{
        padding: safeArea 
          ? `${MOBILE_SPACING.SAFE_AREA_PADDING}px ${padding}px ${padding + (safeArea ? LAYOUT_DIMENSIONS.BOTTOM_NAV_HEIGHT : 0)}px`
          : `${padding}px`,
        paddingTop: safeArea 
          ? `calc(${MOBILE_SPACING.SAFE_AREA_PADDING}px + env(safe-area-inset-top))`
          : `${padding}px`,
        paddingBottom: safeArea && isMobile
          ? `calc(${padding + LAYOUT_DIMENSIONS.BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom))`
          : safeArea
          ? `calc(${padding}px + env(safe-area-inset-bottom))`
          : `${padding}px`,
        WebkitOverflowScrolling: 'touch',
        overflowX: 'hidden',
      }}
      {...props}
    >
      {children}
    </div>
  );
};

