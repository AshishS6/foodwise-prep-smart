import { useState, useEffect } from 'react';

export interface ResponsiveConfig<T = unknown> {
  mobile?: T;
  tablet?: T;
  desktop?: T;
}

export interface ResponsiveBreakpoints {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: 'mobile' | 'tablet' | 'desktop';
}

// Breakpoints matching design document
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
} as const;

export function useResponsive(): ResponsiveBreakpoints {
  const [breakpoints, setBreakpoints] = useState<ResponsiveBreakpoints>(() => {
    // Safe defaults for SSR
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        breakpoint: 'desktop',
      };
    }

    const width = window.innerWidth;
    const isMobile = width < BREAKPOINTS.mobile;
    const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
    const isDesktop = width >= BREAKPOINTS.tablet;

    return {
      isMobile,
      isTablet,
      isDesktop,
      breakpoint: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
    };
  });

  useEffect(() => {
    const updateBreakpoints = () => {
      const width = window.innerWidth;
      const isMobile = width < BREAKPOINTS.mobile;
      const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
      const isDesktop = width >= BREAKPOINTS.tablet;

      setBreakpoints({
        isMobile,
        isTablet,
        isDesktop,
        breakpoint: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
      });
    };

    window.addEventListener('resize', updateBreakpoints);
    updateBreakpoints();

    return () => window.removeEventListener('resize', updateBreakpoints);
  }, []);

  return breakpoints;
}

/**
 * Hook to get responsive values based on current breakpoint
 * @param config Object with mobile, tablet, and desktop values
 * @returns The appropriate value for the current breakpoint
 */
export function useResponsiveValue<T>(config: ResponsiveConfig<T> & { mobile: T; tablet?: T; desktop?: T }): T {
  const { breakpoint } = useResponsive();
  
  if (breakpoint === 'mobile') {
    return config.mobile;
  }
  
  if (breakpoint === 'tablet') {
    return config.tablet ?? config.desktop ?? config.mobile;
  }
  
  return config.desktop ?? config.tablet ?? config.mobile;
}

/**
 * Hook for conditional rendering based on breakpoints
 */
export function useBreakpoint() {
  const responsive = useResponsive();
  
  return {
    ...responsive,
    // Utility functions for common patterns
    showOnMobile: (content: React.ReactNode) => responsive.isMobile ? content : null,
    showOnTablet: (content: React.ReactNode) => responsive.isTablet ? content : null,
    showOnDesktop: (content: React.ReactNode) => responsive.isDesktop ? content : null,
    hideOnMobile: (content: React.ReactNode) => !responsive.isMobile ? content : null,
    hideOnTablet: (content: React.ReactNode) => !responsive.isTablet ? content : null,
    hideOnDesktop: (content: React.ReactNode) => !responsive.isDesktop ? content : null,
  };
}