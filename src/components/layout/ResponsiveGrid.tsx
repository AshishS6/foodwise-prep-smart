import React from 'react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { MOBILE_SPACING } from '@/constants/mobile';
import { cn } from '@/lib/utils';

interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  autoFit?: boolean;
  minItemWidth?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  autoFit = false,
  minItemWidth = '280px',
  className,
  ...props
}) => {
  const { isMobile, isTablet } = useDeviceDetection();

  const gapClasses = {
    sm: 'gap-2',
    md: isMobile ? `gap-${MOBILE_SPACING.MD / 4}` : `gap-${MOBILE_SPACING.LG / 4}`,
    lg: isMobile ? `gap-${MOBILE_SPACING.LG / 4}` : `gap-${MOBILE_SPACING.XL / 4}`,
  };

  const gapValue = isMobile 
    ? MOBILE_SPACING.MD 
    : isTablet 
    ? MOBILE_SPACING.LG 
    : MOBILE_SPACING.XL;

  if (autoFit) {
    return (
      <div
        className={cn(
          "grid",
          gapClasses[gap],
          className
        )}
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`,
          gap: `${gapValue}px`,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }

  const cols = isMobile 
    ? columns.mobile || 1
    : isTablet 
    ? columns.tablet || 2
    : columns.desktop || 3;

  return (
    <div
      className={cn(
        "grid",
        gapClasses[gap],
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: `${gapValue}px`,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

