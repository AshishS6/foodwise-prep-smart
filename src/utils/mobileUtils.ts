// Mobile-specific constants based on design requirements

// Touch target sizes (iOS HIG and Material Design standards)
export const TOUCH_TARGETS = {
  MINIMUM: 44, // Minimum touch target size in pixels
  SMALL: 36,   // Small touch target for dense layouts
  LARGE: 56,   // Large touch target for primary actions
  COMFORTABLE: 48, // Comfortable touch target size
} as const;

// Breakpoints matching Tailwind configuration
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280,
} as const;

// Mobile-specific spacing
export const MOBILE_SPACING = {
  SAFE_AREA_PADDING: 16,
  CARD_PADDING: 16,
  SECTION_PADDING: 24,
  BOTTOM_NAV_HEIGHT: 64,
  HEADER_HEIGHT: 56,
} as const;

// Viewport and orientation utilities
export const getViewportDimensions = () => {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }
  
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

export const getOrientation = (): 'portrait' | 'landscape' => {
  if (typeof window === 'undefined') {
    return 'portrait';
  }
  
  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
};

export const isPortrait = (): boolean => {
  return getOrientation() === 'portrait';
};

export const isLandscape = (): boolean => {
  return getOrientation() === 'landscape';
};

// Device detection utilities
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  return window.innerWidth < BREAKPOINTS.MOBILE;
};

export const isTabletDevice = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  const width = window.innerWidth;
  return width >= BREAKPOINTS.MOBILE && width < BREAKPOINTS.TABLET;
};

export const isDesktopDevice = (): boolean => {
  if (typeof window === 'undefined') {
    return true;
  }
  
  return window.innerWidth >= BREAKPOINTS.TABLET;
};

export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Safe area utilities for mobile devices
export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined' || !CSS.supports('padding', 'env(safe-area-inset-top)')) {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }
  
  const computedStyle = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0', 10),
    bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0', 10),
    left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0', 10),
    right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0', 10),
  };
};

// Touch target validation
export const validateTouchTarget = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  return rect.width >= TOUCH_TARGETS.MINIMUM && rect.height >= TOUCH_TARGETS.MINIMUM;
};

// Mobile-specific validation helpers
export const validateMobileInput = (value: string, type: 'email' | 'phone' | 'text'): boolean => {
  switch (type) {
    case 'email': {
      // Mobile-friendly email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    }
    
    case 'phone': {
      // Basic phone number validation (digits, spaces, dashes, parentheses)
      const phoneRegex = /^[\d\s\-()+]+$/;
      return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10;
    }
    
    case 'text': {
      // Basic text validation (not empty, reasonable length)
      return value.trim().length > 0 && value.length <= 1000;
    }
    
    default:
      return true;
  }
};

// Scroll utilities for mobile
export const scrollToTop = (smooth: boolean = true): void => {
  if (typeof window === 'undefined') return;
  
  window.scrollTo({
    top: 0,
    behavior: smooth ? 'smooth' : 'auto',
  });
};

export const scrollToElement = (elementId: string, offset: number = 0): void => {
  if (typeof window === 'undefined') return;
  
  const element = document.getElementById(elementId);
  if (element) {
    const elementPosition = element.offsetTop - offset;
    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth',
    });
  }
};

// Prevent scroll on mobile (useful for modals)
export const preventBodyScroll = (): void => {
  if (typeof document === 'undefined') return;
  
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';
};

export const restoreBodyScroll = (): void => {
  if (typeof document === 'undefined') return;
  
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';
};

// Haptic feedback for mobile devices
export const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light'): void => {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return;
  
  // Simple vibration patterns for different feedback types
  const patterns = {
    light: [10],
    medium: [20],
    heavy: [30],
  };
  
  navigator.vibrate(patterns[type]);
};

// Mobile-specific CSS class utilities
export const getMobileClasses = (baseClasses: string, mobileClasses: string): string => {
  return `${baseClasses} ${isMobileDevice() ? mobileClasses : ''}`;
};

export const getResponsiveClasses = (classes: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
}): string => {
  const { mobile = '', tablet = '', desktop = '' } = classes;
  
  if (isMobileDevice()) return mobile;
  if (isTabletDevice()) return tablet;
  return desktop;
};

// Performance utilities for mobile
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};