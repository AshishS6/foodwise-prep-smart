import { TeamMember } from '@/hooks/useTeamMembers';

/**
 * Get the default landing route based on user role
 * Kitchen Staff should land on Kitchen Orders page
 * Other roles land on dashboard
 */
export const getDefaultRoute = (teamMember: TeamMember | null | undefined): string => {
  if (!teamMember) {
    return '/';
  }

  const role = teamMember.role;
  
  // Kitchen Staff should land on Kitchen Orders page
  if (role === 'Kitchen Staff') {
    return '/kitchen-orders';
  }

  // All other roles land on dashboard
  return '/';
};

