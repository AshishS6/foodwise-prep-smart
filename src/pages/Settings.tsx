import React from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Moon, 
  Globe, 
  Shield, 
  Database,
  Smartphone
} from 'lucide-react';

const Settings: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header title="Settings" subtitle="Customize your experience" />
      
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="low-stock">Low Stock Alerts</Label>
                <Switch id="low-stock" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="new-orders">New Order Notifications</Label>
                <Switch id="new-orders" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="daily-reports">Daily Reports</Label>
                <Switch id="daily-reports" />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <Switch id="dark-mode" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="compact-view">Compact View</Label>
                <Switch id="compact-view" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="animations">Animations</Label>
                <Switch id="animations" defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Language & Region */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language & Region
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Button variant="outline" className="w-full justify-start">
                  English (US)
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Button variant="outline" className="w-full justify-start">
                  ₹ Indian Rupee (INR)
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Time Zone</Label>
                <Button variant="outline" className="w-full justify-start">
                  Asia/Kolkata (IST)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full">
                Change Password
              </Button>
              <Button variant="outline" className="w-full">
                Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full">
                Active Sessions
              </Button>
            </CardContent>
          </Card>

          {/* Data & Storage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data & Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-backup">Auto Backup</Label>
                <Switch id="auto-backup" defaultChecked />
              </div>
              <Button variant="outline" className="w-full">
                Export Data
              </Button>
              <Button variant="outline" className="w-full">
                Clear Cache
              </Button>
            </CardContent>
          </Card>

          {/* Mobile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Mobile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="mobile-notifications">Push Notifications</Label>
                <Switch id="mobile-notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="offline-mode">Offline Mode</Label>
                <Switch id="offline-mode" />
              </div>
              <Button variant="outline" className="w-full">
                Download Mobile App
              </Button>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Danger Zone</h3>
            <p className="text-sm text-muted-foreground">
              These actions cannot be undone
            </p>
          </div>
          <Button variant="destructive" disabled>
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;