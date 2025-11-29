import { supabase } from '@/integrations/supabase/client';

export const createTeamMemberIfNotExists = async (userId: string, email: string) => {
  try {
    // Check if team member already exists
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingMember) {
      return existingMember;
    }

    // Create new team member with default role
    const { data: newMember, error } = await supabase
      .from('team_members')
      .insert([
        {
          user_id: userId,
          email: email,
          role: 'Cashier', // Default role
          name: email.split('@')[0] // Use email prefix as default name
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating team member:', error);
      return null;
    }

    console.log('Created team member record:', newMember);
    return newMember;
  } catch (error) {
    console.error('Error in createTeamMemberIfNotExists:', error);
    return null;
  }
};