import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  userRole: string | null;
  userName: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
  inviteTeamMember: (email: string, role: string) => Promise<void>;
  logActivity: (action: string, entityType: string, entityId?: string, details?: any) => Promise<void>;
  makeUserAdmin: (email: string) => Promise<void>;
  updateUserName: (userId: string, name: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: true,
  userRole: null,
  userName: null,
  
  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      set({ session: data.session, user: data.user });
      
      if (data.user) {
        // Get user role
        const { data: roleData } = await supabase.rpc('get_user_role', { 
          user_uuid: data.user.id 
        });
        
        // Get user profile information
        const { data: teamMemberData, error: profileError } = await supabase
          .from('team_members')
          .select('name, role')
          .eq('user_id', data.user.id)
          .maybeSingle();
          
        set({ 
          userRole: roleData || 'Guest',
          userName: teamMemberData?.name || data.user.email.split('@')[0]
        });
        
        // Special handling for the specific email
        if (data.user.email === 'ashishsasikumar@gmail.com') {
          set({ userRole: 'Admin', userName: 'Ashish' });
        }
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Update other methods similarly to handle name correctly
  signUp: async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      set({ session: data.session, user: data.user, userName: name });
      
      if (data.user) {
        // Count existing team members
        const { count, error: countError } = await supabase
          .from('team_members')
          .select('*', { count: 'exact', head: true });
          
        if (countError) throw countError;
        
        if (count === 0) {
          // First user becomes admin
          const { error: roleError } = await supabase
            .from('team_members')
            .insert({
              user_id: data.user.id,
              email: data.user.email,
              name: name,
              role: 'Admin'
            });
            
          if (roleError) throw roleError;
          set({ userRole: 'Admin' });
        } else {
          // Check if user was invited
          const { data: invitedUser, error: inviteError } = await supabase
            .from('team_members')
            .select('role')
            .eq('email', email)
            .maybeSingle();
            
          if (!inviteError && invitedUser) {
            // Update invited user with name and user_id
            const { error: updateError } = await supabase
              .from('team_members')
              .update({ 
                user_id: data.user.id,
                name: name 
              })
              .eq('email', email);
              
            if (updateError) throw updateError;
            set({ userRole: invitedUser.role });
          } else {
            // Register as a regular user if not invited
            const { error: insertError } = await supabase
              .from('team_members')
              .insert({
                user_id: data.user.id,
                email: data.user.email,
                name: name,
                role: 'Cashier' // Default role for new users
              });
              
            if (insertError) throw insertError;
            set({ userRole: 'Cashier' });
          }
        }
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  },
  
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ session: null, user: null, userRole: null, userName: null });
    } catch (error: any) {
      throw new Error(error.message);
    }
  },
  
  checkSession: async () => {
    try {
      set({ loading: true });
      
      // Set up auth state change listener
      supabase.auth.onAuthStateChange((event, session) => {
        set({ session, user: session?.user ?? null });
        
        if (session?.user) {
          // Get user role
          supabase.rpc('get_user_role', { user_uuid: session.user.id })
            .then(({ data: roleData }) => {
              set({ userRole: roleData || 'Guest' });
            });
            
          // Get user name from team_members table
          supabase
            .from('team_members')
            .select('name')
            .eq('user_id', session.user.id)
            .maybeSingle()
            .then(({ data: nameData }) => {
              set({ userName: nameData?.name || null });
            });
        }
      });
      
      const { data: { session } } = await supabase.auth.getSession();
      
      let userRole = null;
      let userName = null;
      
      if (session?.user) {
        // Special handling for the specific email
        if (session.user.email === 'ashishsasikumar@gmail.com') {
          userRole = 'Admin';
          userName = 'Ashish';
          
          // Check if user exists in team_members
          const { data: userData, error: userError } = await supabase
            .from('team_members')
            .select('*')
            .eq('email', session.user.email)
            .maybeSingle();
            
          if (!userData) {
            // Add the user as admin if not already in team_members
            const { error: insertError } = await supabase
              .from('team_members')
              .insert({
                email: session.user.email,
                role: 'Admin',
                user_id: session.user.id,
                name: 'Ashish'
              });
              
            if (insertError) {
              console.error('Failed to add admin user:', insertError);
            }
          } else if (!userData.name) {
            // Update the name if it's not set
            const { error: updateError } = await supabase
              .from('team_members')
              .update({ name: 'Ashish' })
              .eq('email', session.user.email);
              
            if (updateError) {
              console.error('Failed to update admin user name:', updateError);
            }
          }
        } else {
          // For other users, get their role normally
          const { data: roleData } = await supabase.rpc('get_user_role', { 
            user_uuid: session.user.id 
          });
          
          const { data: nameData } = await supabase
            .from('team_members')
            .select('name')
            .eq('user_id', session.user.id)
            .maybeSingle();
            
          userRole = roleData || 'Guest';
          userName = nameData?.name || null;
        }
      }
      
      set({ 
        session, 
        user: session?.user ?? null, 
        userRole,
        userName,
        loading: false 
      });
    } catch (error) {
      set({ loading: false });
      console.error('Failed to check auth session:', error);
    }
  },
  
  inviteTeamMember: async (email: string, role: string) => {
    const { userRole, user } = get();
    
    if (userRole !== 'Admin') {
      throw new Error('Only administrators can invite team members');
    }
    
    try {
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('team_members')
        .select('*')
        .eq('email', email)
        .maybeSingle();
        
      if (checkError) throw checkError;
      
      if (existingUser) {
        throw new Error(`User with email ${email} is already a team member`);
      }
      
      // Add the user to team_members
      const { error: teamError } = await supabase
        .from('team_members')
        .insert({
          email: email,
          role: role,
          user_id: '00000000-0000-0000-0000-000000000000' // Placeholder until user signs up
        });
        
      if (teamError) throw teamError;
      
      await get().logActivity(
        'invite', 
        'team_member', 
        email, 
        { role }
      );
      
      // Send invitation email (in a real app you'd implement this)
      return;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },
  
  makeUserAdmin: async (email: string) => {
    try {
      // For the specific user, we'll handle it directly with a simplified approach
      if (email === 'ashishsasikumar@gmail.com') {
        const { data: userData } = await supabase.auth.getUser();
        
        if (userData && userData.user) {
          // Try to update if exists, or insert if it doesn't
          const { error: upsertError } = await supabase
            .from('team_members')
            .upsert({
              email: email,
              role: 'Admin',
              user_id: userData.user.id,
              name: 'Ashish'
            });
            
          if (upsertError) {
            console.error('Error updating team member:', upsertError);
          }
          
          set({ userRole: 'Admin', userName: 'Ashish' });
          return;
        }
      }
      
      // Regular flow for other users
      const { data: userData, error: userError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('email', email)
        .maybeSingle();
      
      if (userError) throw userError;
      
      if (!userData) {
        // Try to find the user id from auth
        try {
          const { data: authData } = await supabase.auth.getUser();
          
          if (authData && authData.user && authData.user.email === email) {
            const { error: insertError } = await supabase
              .from('team_members')
              .insert({
                email: email,
                role: 'Admin',
                user_id: authData.user.id
              });
              
            if (insertError) throw insertError;
          } else {
            // Fallback for when we can't find the user
            const { error: insertError } = await supabase
              .from('team_members')
              .insert({
                email: email,
                role: 'Admin',
                user_id: '00000000-0000-0000-0000-000000000000' // Placeholder
              });
              
            if (insertError) throw insertError;
          }
        } catch (error) {
          console.error('Error finding user:', error);
        }
      } else {
        // Update existing user role
        const { error: updateError } = await supabase
          .from('team_members')
          .update({ role: 'Admin' })
          .eq('email', email);
          
        if (updateError) throw updateError;
      }
      
      await get().logActivity(
        'update_role', 
        'team_member', 
        email, 
        { role: 'Admin' }
      );
      
      const { user } = get();
      if (user && user.email === email) {
        set({ userRole: 'Admin' });
      }
    } catch (error: any) {
      console.error('Error making user admin:', error);
      throw new Error(error.message);
    }
  },
  
  updateUserName: async (userId: string, name: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ name })
        .eq('user_id', userId);
        
      if (error) throw error;
      
      const { user } = get();
      if (user && user.id === userId) {
        set({ userName: name });
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  },
  
  logActivity: async (action: string, entityType: string, entityId?: string, details?: any) => {
    try {
      if (!get().user) return;
      
      await supabase.rpc('log_activity', { 
        action,
        entity_type: entityType,
        entity_id: entityId || '',
        details: details || {}
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }
}));

useAuthStore.getState().checkSession();
