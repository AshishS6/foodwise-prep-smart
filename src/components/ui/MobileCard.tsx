import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { MOBILE_SPACING, TOUCH_TARGETS, ANIMATION_DURATIONS } from '@/constants/mobile';
import { triggerHapticFeedback } from '@/utils/mobileUtils';
import { cn } from '@/lib/utils';

interface MobileCardProps extends React.ComponentProps<typeof Card> {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  swipeable?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onClick?: () => void;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  title,
  subtitle,
  footer,
  swipeable = false,
  onSwipeLeft,
  onSwipeRight,
  onClick,
  className,
  ...props
}) => {
  const { isMobile, touchSupported } = useDeviceDetection();
  const [isPressed, setIsPressed] = useState(false);
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!swipeable || !touchSupported) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setIsPressed(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!swipeable || !touchSupported || !touchStartRef.current) {
      setIsPressed(false);
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Check if horizontal swipe is more significant than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX < 0 && onSwipeLeft) {
        triggerHapticFeedback('light');
        onSwipeLeft();
      } else if (deltaX > 0 && onSwipeRight) {
        triggerHapticFeedback('light');
        onSwipeRight();
      }
    }

    touchStartRef.current = null;
    setIsPressed(false);
  };

  const padding = isMobile ? MOBILE_SPACING.MD : MOBILE_SPACING.LG;

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        isMobile && "rounded-lg",
        onClick && "cursor-pointer active:scale-[0.98]",
        isPressed && swipeable && "scale-[0.98]",
        className
      )}
      style={{
        transitionDuration: `${ANIMATION_DURATIONS.NORMAL}ms`,
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={onClick}
      {...props}
    >
      {(title || subtitle) && (
        <CardHeader style={{ padding: `${padding}px` }}>
          {title && <CardTitle className="text-lg">{title}</CardTitle>}
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </CardHeader>
      )}
      <CardContent style={{ padding: `${padding}px` }}>
        {children}
      </CardContent>
      {footer && (
        <CardFooter style={{ padding: `${padding}px` }}>
          {footer}
        </CardFooter>
      )}
    </Card>
  );
};

