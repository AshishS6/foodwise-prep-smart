import React from 'react';
import { Header } from '@/components/layout/Header';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { MobileContainer } from '@/components/layout/MobileContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MobileCard } from '@/components/ui/MobileCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MobileFriendlyInput } from '@/components/ui/MobileFriendlyInput';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentTeamMember } from '@/hooks/useTeamMembers';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TOUCH_TARGETS } from '@/constants/mobile';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { data: teamMember } = useCurrentTeamMember();
  const { isMobile } = useDeviceDetection();

  const getUserInitials = () => {
    if (teamMember?.name) {
      return teamMember.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const CardComponent = isMobile ? MobileCard : Card;
  const CardHeaderComponent = isMobile ? 'div' : CardHeader;
  const CardContentComponent = isMobile ? 'div' : CardContent;
  const CardTitleComponent = isMobile ? 'div' : CardTitle;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {isMobile ? (
        <MobileHeader title="Profile" subtitle="Manage your account settings" />
      ) : (
        <Header title="Profile" subtitle="Manage your account settings" />
      )}
      
      <MobileContainer className="md:container md:mx-auto md:p-6 md:max-w-2xl">
        <CardComponent>
          <CardHeaderComponent className={isMobile ? "p-4 pb-2" : ""}>
            <CardTitleComponent className={`flex items-center gap-4 ${isMobile ? "flex-col text-center" : ""}`}>
              <Avatar className={`${isMobile ? "h-20 w-20" : "h-16 w-16"}`}>
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className={isMobile ? "text-center" : ""}>
                <h2 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold`}>
                  {teamMember?.name || user?.email?.split('@')[0] || 'User'}
                </h2>
                <Badge variant="secondary" className="mt-1">
                  {teamMember?.role || 'Guest'}
                </Badge>
              </div>
            </CardTitleComponent>
          </CardHeaderComponent>
          
          <CardContentComponent className={isMobile ? "p-4 pt-2 space-y-6" : "space-y-6"}>
            <div className={isMobile ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
              {isMobile ? (
                <>
                  <MobileFriendlyInput
                    id="name"
                    label="Full Name"
                    value={teamMember?.name || ''} 
                    placeholder="Enter your full name"
                    disabled
                  />
                  <MobileFriendlyInput
                    id="email"
                    label="Email"
                    type="email"
                    inputMode="email"
                    value={user?.email || ''} 
                    disabled
                  />
                  <MobileFriendlyInput
                    id="role"
                    label="Role"
                    value={teamMember?.role || 'Guest'} 
                    disabled
                  />
                  <MobileFriendlyInput
                    id="joined"
                    label="Member Since"
                    value={teamMember?.created_at ? new Date(teamMember.created_at).toLocaleDateString() : 'N/A'} 
                    disabled
                  />
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      value={teamMember?.name || ''} 
                      placeholder="Enter your full name"
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      value={user?.email || ''} 
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input 
                      id="role" 
                      value={teamMember?.role || 'Guest'} 
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="joined">Member Since</Label>
                    <Input 
                      id="joined" 
                      value={teamMember?.created_at ? new Date(teamMember.created_at).toLocaleDateString() : 'N/A'} 
                      disabled
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="pt-4">
              <Button 
                disabled
                className={isMobile ? "w-full min-h-[44px] text-base" : ""}
                style={isMobile ? { minHeight: `${TOUCH_TARGETS.MINIMUM}px` } : undefined}
              >
                Update Profile (Coming Soon)
              </Button>
            </div>
          </CardContentComponent>
        </CardComponent>
      </MobileContainer>
    </div>
  );
};

export default Profile;