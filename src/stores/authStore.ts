
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,
  
  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      set({ session: data.session, user: data.user });
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
    } catch (error: any) {
      throw new Error(error.message);
    }
  },
  
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ session: null, user: null });
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
      });
      
      // Then check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      set({ 
        session, 
        user: session?.user ?? null, 
        loading: false 
      });
    } catch (error) {
      set({ loading: false });
      console.error('Failed to check auth session:', error);
    }
  },
}));

// Initialize session check on import
useAuthStore.getState().checkSession();
