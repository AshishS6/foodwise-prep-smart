# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server on port 8080
npm run build      # Production build
npm run build:dev  # Dev-mode build
npm run lint       # ESLint validation
npm run preview    # Preview production build
```

No test runner is configured — there is no `test` script.

## Architecture

**FoodWise Prep Smart** is a restaurant/kitchen management SPA (React + Vite + TypeScript) with POS, inventory, recipes, prep planning, team management, and analytics.

### Tech Stack

- **Frontend:** React 18, React Router 6, TypeScript 5.5
- **Build:** Vite with React SWC, path alias `@/` → `./src/`
- **UI:** shadcn/ui pattern — Radix UI primitives wrapped in `src/components/ui/`, styled with Tailwind CSS
- **State:** Zustand (`authStore`) for global auth/role state; React Query v5 for server state; React Context for auth session and mobile layout
- **Backend:** Supabase (PostgreSQL + Auth); all DB operations go through `src/services/supabaseService.ts`
- **Forms:** React Hook Form + Zod validation

### State Management Layers

1. **Zustand `authStore`** — login, role detection, activity logging; persists via Supabase session
2. **`AuthContext`** — wraps Supabase auth (signIn/signUp/signOut/resetPassword)
3. **`MobileLayoutContext`** — bottom nav visibility, offline mode preference
4. **React Query** — all server data; configured with 5-min stale time, 1 retry, no refetch on focus

### Service Layer

All database access goes through `src/services/supabaseService.ts`, which exports: `authService`, `menuService`, `ingredientService`, `orderService`, `prepPlanService`, `teamService`, `activityService`, `recipeService`. Use these rather than calling Supabase directly from components.

### Routing & Access Control

Routes are lazy-loaded via `React.lazy()` and wrapped with `ProtectedRoute`. Role-based permissions:

| Role          | Accessible Routes                                                   |
|---------------|---------------------------------------------------------------------|
| Admin         | All routes                                                          |
| Manager       | dashboard, pos, inventory, recipes, prepplans, orderhistory, analytics, reports, kitchen |
| Kitchen Staff | pos, inventory, recipes, prepplans, kitchen                         |
| Cashier       | dashboard, pos, orderhistory                                        |

The email `ashishsasikumar@gmail.com` always receives admin access regardless of DB role.

### Mobile vs Desktop

The app renders separate component trees for mobile and desktop, detected via `useDeviceDetection()`. Mobile uses a bottom nav bar (`MobileBottomNav`); desktop uses a sidebar. Touch targets are customized in `tailwind.config.ts` (44px, 36px, 56px) with safe area inset utilities for notches. Build mobile-aware components using `useMobileLayout()` and `useDeviceDetection()` hooks.

### Database Schema (Supabase tables)

`activity_logs`, `ingredients`, `menuitems` (with JSON `portions`), `orders` (with JSON `items`), `prepplans`, `recipes` (links menuitems↔ingredients), `team_members` (with role enum). Auto-generated types live in `src/integrations/supabase/types.ts`.

### TypeScript Config

Type checking is intentionally loose: `noImplicitAny: false`, `strictNullChecks: false`, `noUnusedLocals: false`. Don't tighten these without discussion — it's a deliberate tradeoff for development speed.

## Environment Variables

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_APP_URL=http://localhost:8080
```

Validated at startup in `src/config/supabase.ts` — URL must start with `https://` or `http://localhost`; anon key must start with `eyJ`.

## Conventions

- Timezone: `Asia/Kolkata` is used explicitly in date operations throughout the app
- All user actions should be logged to `activity_logs` via `activityService` (audit trail)
- Charts use Recharts; Excel export uses exceljs + file-saver
- The app uses `next-themes` for dark mode (via Tailwind `class` strategy)
- Lovable component tagger is active in dev mode — don't remove the `componentTagger()` plugin from `vite.config.ts`
