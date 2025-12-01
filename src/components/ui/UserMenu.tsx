import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentTeamMember } from '@/hooks/useTeamMembers';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { TOUCH_TARGETS } from '@/constants/mobile';
import { 
  User, 
  LogOut, 
  Shield,
  ChevronDown,
  Users
} from 'lucide-react';

export const UserMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const { data: teamMember } = useCurrentTeamMember();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isMobile } = useDeviceDetection();
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        toast({
          title: "Logout Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out.",
        });
        navigate('/auth');
      }
    } catch (error: unknown) {
      toast({
        title: "Logout Failed",
        description: (error as Error)?.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

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

  const getUserDisplayName = () => {
    return teamMember?.name || user?.email?.split('@')[0] || 'User';
  };

  const getUserRole = () => {
    return teamMember?.role || 'Guest';
  };

  const hasTeamAccess = () => {
    const role = getUserRole();
    return role === 'Admin' || role === 'Manager';
  };

  if (isMobile) {
    return (
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 h-auto p-2 min-h-[44px]"
            style={{ minHeight: `${TOUCH_TARGETS.MINIMUM}px` }}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[60vh]">
          <SheetHeader>
            <SheetTitle>Account</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-base">{getUserDisplayName()}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Shield className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{getUserRole()}</span>
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              className="w-full justify-start min-h-[44px] text-base"
              style={{ minHeight: `${TOUCH_TARGETS.MINIMUM}px` }}
              onClick={() => {
                navigate('/profile');
                setSheetOpen(false);
              }}
            >
              <User className="mr-3 h-5 w-5" />
              <span>Profile</span>
            </Button>
            
            {hasTeamAccess() && (
              <Button
                variant="ghost"
                className="w-full justify-start min-h-[44px] text-base"
                style={{ minHeight: `${TOUCH_TARGETS.MINIMUM}px` }}
                onClick={() => {
                  navigate('/team-management');
                  setSheetOpen(false);
                }}
              >
                <Users className="mr-3 h-5 w-5" />
                <span>Team Management</span>
              </Button>
            )}
            
            <div className="pt-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start min-h-[44px] text-base text-destructive hover:text-destructive"
                style={{ minHeight: `${TOUCH_TARGETS.MINIMUM}px` }}
                onClick={() => {
                  handleLogout();
                  setSheetOpen(false);
                }}
              >
                <LogOut className="mr-3 h-5 w-5" />
                <span>Log out</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 h-auto p-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-sm">
            <span className="font-medium">{getUserDisplayName()}</span>
            <span className="text-xs text-muted-foreground">{getUserRole()}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Shield className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{getUserRole()}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        
        {hasTeamAccess() && (
          <DropdownMenuItem onClick={() => navigate('/team-management')} className="cursor-pointer">
            <Users className="mr-2 h-4 w-4" />
            <span>Team Management</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleLogout} 
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};