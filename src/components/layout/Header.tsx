import React from 'react';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/ui/UserMenu';
import { useCurrentTeamMember } from '@/hooks/useTeamMembers';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  title = "Payasakkada", 
  subtitle = "Smart restaurant management system" 
}) => {
  const navigate = useNavigate();
  const { data: teamMember } = useCurrentTeamMember();

  return (
    <header className="flex justify-between items-center py-8 px-6 bg-white/50 backdrop-blur-sm border-b">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          {title}
        </h1>
        <p className="text-muted-foreground mt-1">{subtitle}</p>
      </div>
      <div className="flex items-center gap-4">
        {teamMember?.role === 'Admin' && (
          <Button 
            variant="outline" 
            className="flex gap-2 hover:bg-primary/5" 
            onClick={() => navigate('/team-management')}
          >
            <UserPlus className="h-5 w-5 text-primary" />
            Team Management
          </Button>
        )}
        <UserMenu />
      </div>
    </header>
  );
};