# Supabase Auth URL Configuration

## Current Issue
Your app is running on `localhost:8080` but Supabase is configured for different URLs.

## Fix Steps

### 1. Update Supabase Dashboard
Go to: https://supabase.com/dashboard/project/obyyvjwnowrvonteuekw/auth/url-configuration

### 2. Set Site URL
```
http://localhost:8080
```

### 3. Add Redirect URLs (click "Add URL" for each)
```
http://localhost:8080/auth/callback
http://localhost:8080/auth
http://localhost:8080
```

### 4. For Production (when you deploy)
Add your production URLs:
```
https://yourdomain.com
https://yourdomain.com/auth
https://yourdomain.com/auth/callback
```

## After Configuration
1. Save the changes in Supabase dashboard
2. Restart your development server
3. Try accessing your app again

## Test Email Verification
1. Sign up with a new email
2. Check email and click verification link
3. Should redirect to proper callback page
4. Then redirect to sign-in or dashboard