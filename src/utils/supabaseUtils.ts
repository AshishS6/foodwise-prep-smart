import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

// Error handling utility
export const handleSupabaseError = (error: PostgrestError | null): string | null => {
  if (!error) return null;
  
  // Common error messages mapping
  const errorMessages: { [key: string]: string } = {
    '23505': 'This record already exists',
    '23503': 'Cannot delete this record as it is referenced by other data',
    '42501': 'You do not have permission to perform this action',
    'PGRST116': 'The result contains 0 rows',
  };

  return errorMessages[error.code] || error.message || 'An unexpected error occurred';
};

// Date formatting utilities
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString();
};

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString();
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Real-time subscription utilities
export const subscribeToTable = (
  tableName: string,
  callback: (payload: any) => void,
  filter?: string
) => {
  const channel = supabase
    .channel(`${tableName}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName,
        filter: filter,
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Batch operations
export const batchInsert = async <T>(
  tableName: string,
  records: T[],
  batchSize: number = 100
): Promise<{ data: T[] | null; error: PostgrestError | null }> => {
  const results: T[] = [];
  let error: PostgrestError | null = null;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { data, error: batchError } = await supabase
      .from(tableName)
      .insert(batch)
      .select();

    if (batchError) {
      error = batchError;
      break;
    }

    if (data) {
      results.push(...data);
    }
  }

  return { data: results.length > 0 ? results : null, error };
};

// Query builder utilities
export const buildDateRangeFilter = (startDate: string, endDate: string) => {
  return {
    gte: startDate,
    lte: endDate,
  };
};

export const buildSearchFilter = (searchTerm: string, columns: string[]) => {
  return columns.map(column => `${column}.ilike.%${searchTerm}%`).join(',');
};

// File upload utilities (if you plan to add file uploads)
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File
): Promise<{ data: any; error: any }> => {
  return await supabase.storage
    .from(bucket)
    .upload(path, file);
};

export const getFileUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
};

// Cache utilities
export const invalidateQuery = (queryKey: string) => {
  // This would work with React Query's query client
  // You can implement this based on your caching strategy
  console.log(`Invalidating query: ${queryKey}`);
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Analytics utilities
export const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export const calculateAverage = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
};

// Logging utility
export const logActivity = async (
  action: string,
  entityType: string,
  entityId?: string,
  details?: any
) => {
  try {
    await supabase.rpc('log_activity', {
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};