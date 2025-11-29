// Auth hooks
export { useAuth } from '@/contexts/AuthContext';

// Base Supabase hooks
export { useSupabaseQuery, useSupabaseMutation } from './useSupabase';

// Entity-specific hooks
export * from './useMenuItems';
export * from './useIngredients';
export * from './useOrders';
export * from './usePrepPlans';
export * from './useTeamMembers';
export * from './useActivityLogs';
export * from './useRecipes';

// Existing hooks
export { useMobile } from './use-mobile';
export { useToast } from './use-toast';
export { useBillGroups } from './useBillGroups';
export { useCart } from './useCart';
export { useOrderSubmission } from './useOrderSubmission';

// Mobile optimization hooks
export { useDeviceDetection } from './useDeviceDetection';
export { useResponsive, useResponsiveValue, useBreakpoint } from './useResponsive';