// Supabase configuration constants
export const SUPABASE_CONFIG = {
  // Use hosted Supabase project
  url: import.meta.env.VITE_SUPABASE_URL || "https://obyyvjwnowrvonteuekw.supabase.co",
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ieXl2andub3dydm9udGV1ZWt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTUyOTUsImV4cCI6MjA3OTk5MTI5NX0.hyhFgN3R3AoRcSGu77IHIE05dDojnEy09JD2yHyAON8"
};

// Validate configuration
export const validateSupabaseConfig = () => {
  const { url, anonKey } = SUPABASE_CONFIG;
  
  if (!url || !anonKey) {
    throw new Error('Missing Supabase configuration');
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