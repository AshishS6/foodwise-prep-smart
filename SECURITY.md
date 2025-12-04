# Security Documentation

## Overview

This document outlines the security measures implemented in the FoodWise application and provides guidance on maintaining security best practices.

## Critical Security Fixes Applied

### 1. Row Level Security (RLS) Policies

**Status**: ✅ Fixed

All database tables now have proper Row Level Security (RLS) enabled with role-based access control:

- **Admin**: Full access to all features
- **Manager**: Access to most features except team management
- **Kitchen Staff**: POS, inventory, recipes, prep plans, kitchen orders
- **Cashier**: Dashboard, POS, order history (read-only for most)

**Migration**: `20251203000000_fix_security_rls_policies.sql`

### 2. API Key Security

**Status**: ✅ Fixed

- Removed hardcoded API keys from source code
- Configuration now requires environment variables
- See `.env.example` for required variables

### 3. Role-Based Access Control

**Status**: ✅ Fixed

- Database-level role checks (not just frontend)
- Policies match frontend permissions exactly
- Prevents unauthorized access even if frontend is bypassed

## Security Architecture

### Authentication

- Supabase Auth handles user authentication
- JWT tokens used for API requests
- Session management handled by Supabase client

### Authorization

- **Frontend**: Role-based route protection (`App.tsx`)
- **Backend**: Database-level RLS policies enforce permissions
- **Double Protection**: Both layers must pass for access

### Data Access Patterns

1. **Read Operations**: Role-based read access
2. **Write Operations**: Stricter role requirements
3. **Admin Operations**: Admin-only functions use RPC with SECURITY DEFINER

## Role Permissions Matrix

| Feature | Admin | Manager | Kitchen Staff | Cashier |
|---------|-------|---------|---------------|---------|
| Dashboard | ✅ | ✅ | ❌ | ✅ |
| POS | ✅ | ✅ | ✅ | ✅ |
| Inventory (Read) | ✅ | ✅ | ✅ | ❌ |
| Inventory (Write) | ✅ | ✅ | ✅ | ❌ |
| Recipes (Read) | ✅ | ✅ | ✅ | ❌ |
| Recipes (Write) | ✅ | ✅ | ✅ | ❌ |
| Prep Plans | ✅ | ✅ | ✅ | ❌ |
| Order History | ✅ | ✅ | ❌ | ✅ |
| Analytics | ✅ | ✅ | ❌ | ❌ |
| Team Management | ✅ | ❌ | ❌ | ❌ |
| Kitchen Orders | ✅ | ✅ | ✅ | ❌ |

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_APP_URL=http://localhost:8080
```

### 2. Apply Database Migration

Run the security fix migration in Supabase Dashboard:

1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase/migrations/20251203000000_fix_security_rls_policies.sql`
3. Execute the migration

### 3. Verify RLS is Enabled

In Supabase Dashboard:

1. Go to Authentication → Policies
2. Verify all tables show "RLS enabled" (not "Unrestricted")
3. Check that policies are created for each table

## Security Best Practices

### ✅ DO

- Always use environment variables for sensitive data
- Keep `.env` file in `.gitignore`
- Regularly review and update RLS policies
- Test role-based access after changes
- Use RPC functions for complex operations
- Log security-relevant activities

### ❌ DON'T

- Never hardcode API keys or secrets
- Don't commit `.env` files to version control
- Don't disable RLS without proper policies
- Don't create overly permissive policies
- Don't rely solely on frontend security checks

## Ongoing Security Maintenance

### Regular Tasks

1. **Monthly**: Review RLS policies for any changes needed
2. **Quarterly**: Audit user roles and permissions
3. **After Feature Changes**: Update policies to match new features
4. **After Security Incidents**: Review and tighten policies

### Monitoring

- Monitor Supabase logs for unauthorized access attempts
- Review activity logs regularly
- Check for any "Unrestricted" tables in dashboard
- Verify environment variables are not exposed

## Troubleshooting

### Issue: "Missing Supabase configuration" error

**Solution**: 
- Ensure `.env` file exists with required variables
- Restart development server after creating `.env`
- Check variable names match exactly (case-sensitive)

### Issue: Users can't access data they should have access to

**Solution**:
- Verify RLS is enabled on the table
- Check user's role in `team_members` table
- Verify policies match expected permissions
- Check Supabase logs for policy evaluation errors

### Issue: RLS policies not working

**Solution**:
- Ensure RLS is enabled: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
- Verify policies exist: Check Supabase Dashboard → Policies
- Check policy conditions are correct
- Verify `get_current_user_role()` function exists

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

## Reporting Security Issues

If you discover a security vulnerability, please:

1. **DO NOT** create a public issue
2. Contact the development team directly
3. Provide detailed information about the vulnerability
4. Allow time for the issue to be addressed before disclosure

## Version History

- **2025-12-03**: Initial security fixes applied
  - Enabled RLS on all tables
  - Created role-based policies
  - Removed hardcoded API keys
  - Added security documentation

