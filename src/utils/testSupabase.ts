import { supabase } from '@/integrations/supabase/client';

export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    
    // Test 1: Check if client is initialized
    console.log('Supabase client:', supabase);
    
    // Test 2: Try to get session (should work even without auth)
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('Session test:', { sessionData, sessionError });
    
    // Test 3: Try a simple database query
    const { data: testData, error: testError } = await supabase
      .from('menuitems')
      .select('count')
      .limit(1);
    console.log('Database test:', { testData, testError });
    
    // Test 4: Check auth configuration
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('User test:', { user, userError });
    
    return {
      connectionOk: !sessionError,
      databaseOk: !testError,
      authOk: !userError,
      errors: {
        session: sessionError,
        database: testError,
        user: userError
      }
    };
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return {
      connectionOk: false,
      databaseOk: false,
      authOk: false,
      errors: { general: error }
    };
  }
};

// Call this function to test the connection
if (typeof window !== 'undefined') {
  testSupabaseConnection().then(result => {
    console.log('Supabase test results:', result);
  });
}