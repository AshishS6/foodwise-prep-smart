import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing email verification...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the tokens from URL parameters
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const type = searchParams.get('type');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Handle errors first
        if (error) {
          setStatus('error');
          setMessage(errorDescription || 'Authentication failed');
          toast({
            title: "Verification Failed",
            description: errorDescription || error,
            variant: "destructive",
          });
          return;
        }

        // Handle email confirmation
        if (type === 'signup' || type === 'email_change' || type === 'recovery') {
          if (accessToken && refreshToken) {
            // Set the session with the tokens
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              throw sessionError;
            }

            if (data.user) {
              setStatus('success');
              setMessage('Email verified successfully! Redirecting to dashboard...');
              
              toast({
                title: "Email Verified!",
                description: "Your email has been successfully verified.",
              });

              // Redirect to dashboard after a short delay
              setTimeout(() => {
                navigate('/', { replace: true });
              }, 2000);
            } else {
              throw new Error('No user data received');
            }
          } else {
            // If no tokens, just redirect to sign in
            setStatus('success');
            setMessage('Email verified! Please sign in to continue.');
            
            toast({
              title: "Email Verified!",
              description: "Please sign in to access your account.",
            });

            setTimeout(() => {
              navigate('/auth', { replace: true });
            }, 2000);
          }
        } else {
          // Unknown type, redirect to sign in
          setStatus('success');
          setMessage('Redirecting to sign in...');
          setTimeout(() => {
            navigate('/auth', { replace: true });
          }, 1000);
        }
      } catch (error: any) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage(error.message || 'An unexpected error occurred');
        
        toast({
          title: "Verification Error",
          description: error.message || 'Failed to verify email',
          variant: "destructive",
        });
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate, toast]);

  const handleContinue = () => {
    if (status === 'error') {
      navigate('/auth', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
            
            {status === 'loading' && 'Verifying Email'}
            {status === 'success' && 'Email Verified'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          
          {status === 'loading' && (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          
          {status === 'error' && (
            <Button onClick={handleContinue} className="w-full">
              Continue to Sign In
            </Button>
          )}
          
          {status === 'success' && (
            <div className="text-sm text-green-600">
              You will be redirected automatically...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;