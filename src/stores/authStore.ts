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

let authSubscription: { unsubscribe: () => void } | null = null;

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
        const { data: teamMemberData } = await supabase
          .from('team_members')
          .select('name, role')
          .eq('email', data.user.email)
          .maybeSingle();

        set({
          userRole: teamMemberData?.role || 'Guest',
          userName: teamMemberData?.name || data.user.email.split('@')[0]
        });
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  signUp: async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      set({ session: data.session, user: data.user, userName: name });

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
              name: name,
              role: 'Admin'
            });

          if (roleError) throw roleError;
          set({ userRole: 'Admin' });
        } else {
          const { data: invitedUser, error: inviteError } = await supabase
            .from('team_members')
            .select('role')
            .eq('email', email)
            .maybeSingle();

          if (!inviteError && invitedUser) {
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
            const { error: insertError } = await supabase
              .from('team_members')
              .insert({
                user_id: data.user.id,
                email: data.user.email,
                name: name,
                role: 'Cashier'
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

      // Unsubscribe from any existing listener before registering a new one
      if (authSubscription) {
        authSubscription.unsubscribe();
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        set({ session, user: session?.user ?? null });

        if (session?.user) {
          supabase
            .from('team_members')
            .select('role, name')
            .eq('email', session.user.email)
            .maybeSingle()
            .then(({ data }) => {
              set({
                userRole: data?.role || 'Guest',
                userName: data?.name || null
              });
            });
        }
      });

      authSubscription = subscription;

      const { data: { session } } = await supabase.auth.getSession();

      let userRole = null;
      let userName = null;

      if (session?.user) {
        const { data: teamData } = await supabase
          .from('team_members')
          .select('role, name')
          .eq('email', session.user.email)
          .maybeSingle();

        userRole = teamData?.role || 'Guest';
        userName = teamData?.name || null;
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
    try {
      const { error } = await supabase.rpc('invite_team_member_rpc', {
        invite_email: email,
        invite_role: role,
      });

      if (error) {
        throw new Error(error.message);
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
        const { data: authData } = await supabase.auth.getUser();

        if (authData?.user?.email === email) {
          const { error: insertError } = await supabase
            .from('team_members')
            .insert({
              email: email,
              role: 'Admin',
              user_id: authData.user.id
            });

          if (insertError) throw insertError;
        } else {
          throw new Error('Cannot promote a user who has not registered yet.');
        }
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
