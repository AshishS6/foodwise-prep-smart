import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

export interface UseSupabaseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: PostgrestError | null;
  refetch: () => Promise<void>;
}

export function useSupabaseQuery<T>(
  query: () => Promise<{ data: T | null; error: PostgrestError | null }>
): UseSupabaseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await query();
      setData(result.data);
      setError(result.error);
    } catch (err) {
      setError(err as PostgrestError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

export interface UseSupabaseMutationResult<T> {
  mutate: (variables: any) => Promise<T | null>;
  loading: boolean;
  error: PostgrestError | null;
}

export function useSupabaseMutation<T>(
  mutation: (variables: any) => Promise<{ data: T | null; error: PostgrestError | null }>
): UseSupabaseMutationResult<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const mutate = async (variables: any): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await mutation(variables);
      setError(result.error);
      return result.data;
    } catch (err) {
      setError(err as PostgrestError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    mutate,
    loading,
    error,
  };
}