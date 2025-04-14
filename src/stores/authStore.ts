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
  makeUserAdmin: (email: string) => Promise<void>;
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
      
      if (data.user) {
        const { count, error: countError } = await supabase
          .from('team_members')
          .select('*', { count: 'exact', head: true });
          
        if (countError) throw countError;
        
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
      
      supabase.auth.onAuthStateChange((event, session) => {
        set({ session, user: session?.user ?? null });
        
        if (session?.user) {
          supabase.rpc('get_user_role', { user_uuid: session.user.id })
            .then(({ data }) => {
              set({ userRole: data || 'Guest' });
            });
        }
      });
      
      const { data: { session } } = await supabase.auth.getSession();
      
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

      if (session?.user && session.user.email === 'ashishsasikumar@gmail.com') {
        try {
          await get().makeUserAdmin('ashishsasikumar@gmail.com');
        } catch (error) {
          console.error('Failed to make user admin:', error);
        }
      }
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
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email);
      
      if (error) throw error;
      
      if (data) {
        const { error: teamError } = await supabase
          .from('team_members')
          .insert({
            user_id: data.user.id,
            email: email,
            role: role
          });
        
        if (teamError) throw teamError;
        
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
  
  makeUserAdmin: async (email: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('email', email)
        .maybeSingle();
      
      if (userError) throw userError;
      
      if (!userData) {
        const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) throw authError;
        
        const user = authUser.users.find(u => u.email === email);
        
        if (!user) {
          throw new Error('User not found');
        }
        
        const { error: insertError } = await supabase
          .from('team_members')
          .insert({
            user_id: user.id,
            email: email,
            role: 'Admin'
          });
          
        if (insertError) throw insertError;
      } else {
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
