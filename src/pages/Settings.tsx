import React from 'react';
import { Header } from '@/components/layout/Header';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { MobileContainer } from '@/components/layout/MobileContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MobileCard } from '@/components/ui/MobileCard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { TOUCH_TARGETS } from '@/constants/mobile';
import { 
  Bell, 
  Moon, 
  Globe, 
  Shield, 
  Database,
  Smartphone
} from 'lucide-react';

const Settings: React.FC = () => {
  const { isMobile } = useDeviceDetection();
  const CardComponent = isMobile ? MobileCard : Card;
  const CardHeaderComponent = isMobile ? 'div' : CardHeader;
  const CardContentComponent = isMobile ? 'div' : CardContent;
  const CardTitleComponent = isMobile ? 'h3' : CardTitle;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {isMobile ? (
        <MobileHeader title="Settings" subtitle="Customize your experience" />
      ) : (
        <Header title="Settings" subtitle="Customize your experience" />
      )}
      
      <MobileContainer className="md:container md:mx-auto md:p-6 md:max-w-4xl">
        <div className={isMobile ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
          
          {/* Notifications */}
          <CardComponent>
            <CardHeaderComponent className={isMobile ? "p-4 pb-2" : ""}>
              <CardTitleComponent className={`flex items-center gap-2 ${isMobile ? "text-lg font-semibold" : ""}`}>
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitleComponent>
            </CardHeaderComponent>
            <CardContentComponent className={isMobile ? "p-4 pt-2 space-y-4" : "space-y-4"}>
              <div className="flex items-center justify-between min-h-[44px]">
                <Label htmlFor="low-stock" className="text-base">Low Stock Alerts</Label>
                <Switch id="low-stock" defaultChecked style={{ minHeight: `${TOUCH_TARGETS.MINIMUM}px` }} />
              </div>
              <div className="flex items-center justify-between min-h-[44px]">
                <Label htmlFor="new-orders" className="text-base">New Order Notifications</Label>
                <Switch id="new-orders" defaultChecked style={{ minHeight: `${TOUCH_TARGETS.MINIMUM}px` }} />
              </div>
              <div className="flex items-center justify-between min-h-[44px]">
                <Label htmlFor="daily-reports" className="text-base">Daily Reports</Label>
                <Switch id="daily-reports" style={{ minHeight: `${TOUCH_TARGETS.MINIMUM}px` }} />
              </div>
            </CardContentComponent>
          </CardComponent>

          {/* Appearance */}
          <CardComponent>
            <CardHeaderComponent className={isMobile ? "p-4 pb-2" : ""}>
              <CardTitleComponent className={`flex items-center gap-2 ${isMobile ? "text-lg font-semibold" : ""}`}>
                <Moon className="h-5 w-5" />
                Appearance
              </CardTitleComponent>
            </CardHeaderComponent>
            <CardContentComponent className={isMobile ? "p-4 pt-2 space-y-4" : "space-y-4"}>
              <div className="flex items-center justify-between min-h-[44px]">
                <Label htmlFor="dark-mode" className="text-base">Dark Mode</Label>
                <Switch id="dark-mode" style={{ minHeight: `${TOUCH_TARGETS.MINIMUM}px` }} />
              </div>
              <div className="flex items-center justify-between min-h-[44px]">
                <Label htmlFor="compact-view" className="text-base">Compact View</Label>
                <Switch id="compact-view" style={{ minHeight: `${TOUCH_TARGETS.MINIMUM}px` }} />
              </div>
              <div className="flex items-center justify-between min-h-[44px]">
                <Label htmlFor="animations" className="text-base">Animations</Label>
                <Switch id="animations" defaultChecked style={{ minHeight: `${TOUCH_TARGETS.MINIMUM}px` }} />
              </div>
            </CardContentComponent>
          </CardComponent>

          {/* Language & Region */}
          <CardComponent>
            <CardHeaderComponent className={isMobile ? "p-4 pb-2" : ""}>
              <CardTitleComponent className={`flex items-center gap-2 ${isMobile ? "text-lg font-semibold" : ""}`}>
                <Globe className="h-5 w-5" />
                Language & Region
              </CardTitleComponent>
            </CardHeaderComponent>
            <CardContentComponent className={isMobile ? "p-4 pt-2 space-y-4" : "space-y-4"}>
              <div className="space-y-2">
                <Label className="text-base">Language</Label>
                <Button variant="outline" className="w-full justify-start min-h-[44px] text-base" style={{ minHeight: `${TOUCH_TARGETS.MINIMUM}px` }}>
                  English (US)
                </Button>
              </div>
              <div className="space-y-2">
                <Label className="text-base">Currency</Label>
                <Button variant="outline" className="w-full justify-start min-h-[44px] text-base" style={{ minHeight: `${TOUCH_TARGETS.MINIMUM}px` }}>
                  ₹ Indian Rupee (INR)
                </Button>
              </div>
              <div className="space-y-2">
                <Label className="text-base">Time Zone</Label>
                <Button variant="outline" className="w-full justify-start min-h-[44px] text-base" style={{ minHeight: `${TOUCH_TARGETS.MINIMUM}px` }}>
                  Asia/Kolkata (IST)
                </Button>
              </div>
            </CardContentComponent>
          </CardComponent>

          {/* Security */}
          <CardComponent>
            <CardHeaderComponent className={isMobile ? "p-4 pb-2" : ""}>
              <CardTitleComponent className={`flex items-center gap-2 ${isMobile ? "text-lg font-semibold" : ""}`}>
                <Shield className="h-5 w-5" />
                Security
              </CardTitleComponent>
            </CardHeaderComponent>
            <CardContentComponent className={isMobile ? "p-4 pt-2 space-y-4" : "space-y-4"}>
              <Button variant="outline" className="w-full min-h-[44px] text-base" style={{ minHeight: `${TOUCH_TARGETS.MINIMUM}px` }}>
                Change Password
              </Button>
              <Button variant="outline" className="w-full min-h-[44px] text-base" style={{ minHeight: `${TOUCH_TARGETS.MINIMUM}px` }}>
                Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full min-h-[44px] text-base" style={{ minHeight: `${TOUCH_TARGETS.MINIMUM}px` }}>
                Active Sessions
              </Button>
            </CardContentComponent>
          </CardComponent>

          {/* Data & Storage */}
          <CardComponent>
            <CardHeaderComponent className={isMobile ? "p-4 pb-2" : ""}>
              <CardTitleComponent className={`flex items-center gap-2 ${isMobile ? "text-lg font-semibold" : ""}`}>
                <Database className="h-5 w-5" />
                Data & Storage
              </CardTitleComponent>
            </CardHeaderComponent>
            <CardContentComponent className={isMobile ? "p-4 pt-2 space-y-4" : "space-y-4"}>
              <div className="flex items-center justify-between min-h-[44px]">
                <Label htmlFor="auto-backup" className="text-base">Auto Backup</Label>
                <Switch id="auto-backup" defaultChecked style={{ minHeight: `${TOUCH_TARGETS.MINIMUM}px` }} />
              </div>
              <Button variant="outline" className="w-full min-h-[44px] text-base" style={{ minHeight: `${TOUCH_TARGETS.MINIMUM}px` }}>
                Export Data
              </Button>
              <Button variant="outline" className="w-full min-h-[44px] text-base" style={{ minHeight: `${TOUCH_TARGETS.MINIMUM}px` }}>
                Clear Cache
              </Button>
            </CardContentComponent>
          </CardComponent>

          {/* Mobile */}
          <CardComponent>
            <CardHeaderComponent className={isMobile ? "p-4 pb-2" : ""}>
              <CardTitleComponent className={`flex items-center gap-2 ${isMobile ? "text-lg font-semibold" : ""}`}>
                <Smartphone className="h-5 w-5" />
                Mobile
              </CardTitleComponent>
            </CardHeaderComponent>
            <CardContentComponent className={isMobile ? "p-4 pt-2 space-y-4" : "space-y-4"}>
              <div className="flex items-center justify-between min-h-[44px]">
                <Label htmlFor="mobile-notifications" className="text-base">Push Notifications</Label>
                <Switch id="mobile-notifications" defaultChecked style={{ minHeight: `${TOUCH_TARGETS.MINIMUM}px` }} />
              </div>
              <div className="flex items-center justify-between min-h-[44px]">
                <Label htmlFor="offline-mode" className="text-base">Offline Mode</Label>
                <Switch id="offline-mode" style={{ minHeight: `${TOUCH_TARGETS.MINIMUM}px` }} />
              </div>
              <Button variant="outline" className="w-full min-h-[44px] text-base" style={{ minHeight: `${TOUCH_TARGETS.MINIMUM}px` }}>
                Download Mobile App
              </Button>
            </CardContentComponent>
          </CardComponent>
        </div>

        <Separator className="my-8" />

        <div className={`flex ${isMobile ? "flex-col gap-4" : "justify-between items-center"}`}>
          <div>
            <h3 className="text-lg font-semibold">Danger Zone</h3>
            <p className="text-sm text-muted-foreground">
              These actions cannot be undone
            </p>
          </div>
          <Button 
            variant="destructive" 
            disabled
            className={isMobile ? "w-full min-h-[44px] text-base" : ""}
            style={isMobile ? { minHeight: `${TOUCH_TARGETS.MINIMUM}px` } : undefined}
          >
            Delete Account
          </Button>
        </div>
      </MobileContainer>
    </div>
  );
};

export default Settings;