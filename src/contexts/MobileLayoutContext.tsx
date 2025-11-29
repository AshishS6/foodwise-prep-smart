import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

interface MobileLayoutContextType {
  isMobileLayout: boolean;
  showBottomNav: boolean;
  setShowBottomNav: (show: boolean) => void;
  mobilePreferences: {
    offlineMode: boolean;
    animations: boolean;
  };
  setMobilePreferences: (prefs: Partial<MobileLayoutContextType['mobilePreferences']>) => void;
}

const MobileLayoutContext = createContext<MobileLayoutContextType | undefined>(undefined);

export const MobileLayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isMobile } = useDeviceDetection();
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [mobilePreferences, setMobilePreferencesState] = useState({
    offlineMode: false,
    animations: true,
  });

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mobilePreferences');
    if (saved) {
      try {
        const prefs = JSON.parse(saved);
        setMobilePreferencesState(prev => ({ ...prev, ...prefs }));
      } catch (e) {
        console.error('Failed to load mobile preferences', e);
      }
    }
  }, []);

  // Save preferences to localStorage
  const setMobilePreferences = (prefs: Partial<typeof mobilePreferences>) => {
    setMobilePreferencesState(prev => {
      const updated = { ...prev, ...prefs };
      localStorage.setItem('mobilePreferences', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <MobileLayoutContext.Provider
      value={{
        isMobileLayout: isMobile,
        showBottomNav,
        setShowBottomNav,
        mobilePreferences,
        setMobilePreferences,
      }}
    >
      {children}
    </MobileLayoutContext.Provider>
  );
};

export const useMobileLayout = () => {
  const context = useContext(MobileLayoutContext);
  if (!context) {
    throw new Error('useMobileLayout must be used within MobileLayoutProvider');
  }
  return context;
};


