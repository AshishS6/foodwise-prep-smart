import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const SupabaseTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results: any = {};

    try {
      // Test 1: Basic connection
      results.connection = {
        status: 'Connected',
        clientExists: !!supabase
      };

      // Test 2: Auth service
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        results.auth = {
          status: sessionError ? 'Error' : 'OK',
          error: sessionError?.message,
          hasSession: !!sessionData.session
        };
      } catch (error: any) {
        results.auth = {
          status: 'Error',
          error: error.message
        };
      }

      // Test 3: Database access
      try {
        const { data, error } = await supabase
          .from('menuitems')
          .select('count')
          .limit(1);
        
        results.database = {
          status: error ? 'Error' : 'OK',
          error: error?.message,
          canQuery: !error
        };
      } catch (error: any) {
        results.database = {
          status: 'Error',
          error: error.message
        };
      }

      // Test 4: Try a simple sign up test (won't actually create user)
      try {
        const { data, error } = await supabase.auth.signUp({
          email: 'test@example.com',
          password: 'testpassword123'
        });
        
        results.signUpTest = {
          status: error ? 'Error' : 'OK',
          error: error?.message,
          message: error ? error.message : 'Sign up endpoint accessible'
        };
      } catch (error: any) {
        results.signUpTest = {
          status: 'Error',
          error: error.message
        };
      }

    } catch (error: unknown) {
      results.general = {
        status: 'Error',
        error: error.message
      };
    }

    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={runTests} disabled={loading} className="mb-4">
          {loading ? 'Running Tests...' : 'Run Tests'}
        </Button>
        
        {testResults && (
          <div className="space-y-4">
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};