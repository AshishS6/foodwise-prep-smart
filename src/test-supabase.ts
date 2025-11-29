// Simple test to verify Supabase configuration
import { supabase } from '@/integrations/supabase/client';

console.log('Testing Supabase connection...');
console.log('Supabase URL:', supabase.supabaseUrl);
console.log('Supabase Key (first 20 chars):', supabase.supabaseKey?.substring(0, 20) + '...');

// Test basic connection
supabase.auth.getSession().then(({ data, error }) => {
  console.log('Session test:', { data, error });
});

// Test database connection
supabase.from('menuitems').select('count').limit(1).then(({ data, error }) => {
  console.log('Database test:', { data, error });
});

export {};