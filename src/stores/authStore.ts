
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  userRole: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
  inviteTeamMember: (email: string, role: string) => Promise<void>;
  logActivity: (action: string, entityType: string, entityId?: string, details?: any) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: true,
  userRole: null,
  
  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      set({ session: data.session, user: data.user });
      
      // Get user role after sign in
      if (data.user) {
        const { data: roleData } = await supabase.rpc('get_user_role', { 
          user_uuid: data.user.id 
        });
        set({ userRole: roleData || 'Guest' });
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  },
  
  signUp: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      set({ session: data.session, user: data.user });
      
      // If user was created successfully, add them as 'Admin' for the first user
      // or wait for an invitation for subsequent users
      if (data.user) {
        // Check if this is the first user
        const { count, error: countError } = await supabase
          .from('team_members')
          .select('*', { count: 'exact', head: true });
          
        if (countError) throw countError;
        
        // If this is the first user, make them an admin
        if (count === 0) {
          const { error: roleError } = await supabase
            .from('team_members')
            .insert({
              user_id: data.user.id,
              email: data.user.email,
              role: 'Admin'
            });
            
          if (roleError) throw roleError;
          set({ userRole: 'Admin' });
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
      set({ session: null, user: null, userRole: null });
    } catch (error: any) {
      throw new Error(error.message);
    }
  },
  
  checkSession: async () => {
    try {
      set({ loading: true });
      
      // First set up the auth listener for future changes
      supabase.auth.onAuthStateChange((event, session) => {
        set({ session, user: session?.user ?? null });
        
        // Get user role when session changes
        if (session?.user) {
          supabase.rpc('get_user_role', { user_uuid: session.user.id })
            .then(({ data }) => {
              set({ userRole: data || 'Guest' });
            });
        }
      });
      
      // Then check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Get user role if session exists
      let userRole = null;
      if (session?.user) {
        const { data: roleData } = await supabase.rpc('get_user_role', { 
          user_uuid: session.user.id 
        });
        userRole = roleData || 'Guest';
      }
      
      set({ 
        session, 
        user: session?.user ?? null, 
        userRole,
        loading: false 
      });
    } catch (error) {
      set({ loading: false });
      console.error('Failed to check auth session:', error);
    }
  },
  
  inviteTeamMember: async (email: string, role: string) => {
    const { userRole, user } = get();
    
    // Only admins can invite team members
    if (userRole !== 'Admin') {
      throw new Error('Only administrators can invite team members');
    }
    
    try {
      // First, create the user in auth system
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email);
      
      if (error) throw error;
      
      if (data) {
        // Then add them to the team_members table with the specified role
        const { error: teamError } = await supabase
          .from('team_members')
          .insert({
            user_id: data.user.id,
            email: email,
            role: role
          });
        
        if (teamError) throw teamError;
        
        // Log this activity
        await get().logActivity(
          'invite', 
          'team_member', 
          data.user.id, 
          { email, role }
        );
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

// Initialize session check on import
useAuthStore.getState().checkSession();
