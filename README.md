# Payasakkada — Restaurant Management System

A full-stack restaurant management SPA for streamlining kitchen and front-of-house operations. Built as a portfolio project with role-based access, real-time order tracking, inventory management, and analytics.

🔗 **Live:** [payasakkada.vercel.app](https://payasakkada.vercel.app)

---

## Demo Accounts

Try the app instantly — no sign-up required:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@foodwise.demo | FoodWise@2024 |
| Manager | manager@foodwise.demo | FoodWise@2024 |
| Kitchen Staff | kitchen@foodwise.demo | FoodWise@2024 |
| Cashier | cashier@foodwise.demo | FoodWise@2024 |

---

## Features

- **POS System** — Take orders with Full/Half portion sizes, bill splitting, and item notes
- **Inventory Management** — Track ingredient stock with auto-decrement on order completion
- **Recipe Management** — Link menu items to ingredients with exact quantities
- **Prep Planning** — Daily kitchen prep targets vs actuals
- **Kitchen Orders** — Live order queue with status workflow (Pending → In Progress → Ready → Completed)
- **Analytics & Reports** — Revenue charts, order trends, category breakdowns, Excel export
- **Team Management** — Invite team members and assign roles
- **Activity Audit Log** — Every user action logged for accountability

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript 5.5, Vite |
| UI | shadcn/ui (Radix UI), Tailwind CSS |
| State | Zustand (auth), React Query v5 (server state) |
| Backend | Supabase (PostgreSQL + Auth) |
| Security | Row Level Security (RLS) policies per role |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Export | exceljs + file-saver |
| Deployment | Vercel + Supabase Cloud (ap-south-1) |

---

## Role-Based Access

| Role | Accessible Areas |
|------|-----------------|
| Admin | Everything |
| Manager | Dashboard, POS, Inventory, Recipes, Prep Plans, Analytics, Reports, Kitchen |
| Kitchen Staff | POS, Inventory, Recipes, Prep Plans, Kitchen Orders |
| Cashier | Dashboard, POS, Order History |

---

## Local Development

### Prerequisites
- Node.js 18+ ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- A Supabase project with the schema from `supabase/setup.sql`

### Setup

```sh
# Clone the repo
git clone https://github.com/AshishS6/foodwise-prep-smart.git
cd foodwise-prep-smart

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Fill in your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Start dev server
npm run dev
```

App runs at `http://localhost:8080`

### Database Setup

Run the SQL files in order in your Supabase SQL editor:

1. `supabase/setup.sql` — creates tables, functions, and RLS policies
2. `supabase/seed.sql` — populates demo data (menu items, orders, ingredients)
3. `supabase/demo-users.sql` — links demo auth users to roles (create the 4 auth users first)

### Available Scripts

```sh
npm run dev       # Start dev server (port 8080)
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

---

## Deployment

Deployed on Vercel. Set these environment variables in your Vercel project:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_APP_URL=https://your-vercel-url.vercel.app
```

After deploying, add your Vercel URL to Supabase → Authentication → URL Configuration.
