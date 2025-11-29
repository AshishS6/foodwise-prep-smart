import React from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentTeamMember } from '@/hooks/useTeamMembers';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { data: teamMember } = useCurrentTeamMember();

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header title="Profile" subtitle="Manage your account settings" />
      
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">
                  {teamMember?.name || user?.email?.split('@')[0] || 'User'}
                </h2>
                <Badge variant="secondary" className="mt-1">
                  {teamMember?.role || 'Guest'}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
            
            <div className="pt-4">
              <Button disabled>
                Update Profile (Coming Soon)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;