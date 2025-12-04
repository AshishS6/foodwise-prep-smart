// Supabase configuration constants
// SECURITY: Never hardcode API keys in source code!
// Use environment variables instead.
export const SUPABASE_CONFIG = {
  // Use hosted Supabase project
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
};

// Validate configuration
export const validateSupabaseConfig = () => {
  const { url, anonKey } = SUPABASE_CONFIG;
  
  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase configuration. ' +
      'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables. ' +
      'See .env.example for reference.'
    );
  }
  
  if (!url.startsWith('https://') && !url.startsWith('http://localhost')) {
    throw new Error('Invalid Supabase URL format');
  }
  
  if (!anonKey.startsWith('eyJ')) {
    throw new Error('Invalid Supabase anon key format');
  }
  
  return true;
};

// Check if we're in development mode
export const isDevelopment = import.meta.env.DEV;

// Log configuration in development
if (isDevelopment) {
  console.log('Environment variables:', {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
    VITE_APP_URL: import.meta.env.VITE_APP_URL,
    CURRENT_ORIGIN: typeof window !== 'undefined' ? window.location.origin : 'N/A'
  });
  
  console.log('Supabase Configuration:', {
    url: SUPABASE_CONFIG.url,
    keyPrefix: SUPABASE_CONFIG.anonKey.substring(0, 20) + '...',
    isValid: validateSupabaseConfig()
  });
}