# 12Digits Trading Education Platform

## Overview

12Digits is a professional trading education platform that provides real-time market simulation, structured lessons, and comprehensive tools for learning to trade. The platform targets three membership tiers: School (for educators/students), Casual (individual learners), and 12Digits+ (premium features). 

**Casual Tier Features** (Free):
- Lessons, Simulator, Dashboard, Leaderboard, Achievements
- Watchlist - Track favorite stocks with price monitoring
- Trading Tips - Daily tips and market insights

**Premium Features** (12Digits+ or Trial Users):
- Command Center (Terminal), Strategies, Analytics
- Trade Journal, News Feed, Economic Calendar, Risk Calculator
- Friends System - Connect with other traders, send/accept friend requests

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React Context for auth state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Charts**: Recharts for performance graphs, lightweight-charts for candlestick trading charts

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy, session-based auth using express-session with memory store
- **API Design**: RESTful endpoints under `/api` prefix
- **Build Process**: Custom esbuild script that bundles server code, Vite builds client

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Drizzle Kit for schema management (`drizzle-kit push`)
- **Key Tables**: users, lessons, lessonProgress, trades, portfolioItems, assignments, strategies

### Authentication & Authorization
- **Method**: Session-based authentication with Passport.js LocalStrategy
- **Password Hashing**: bcryptjs
- **Session Storage**: In-memory store (memorystore package)
- **Role System**: Three roles - student, teacher, admin
- **Default Admin**: Hardcoded admin user created on startup (admin@12digits.com / 12digits!)

### Project Structure
```
├── client/src/          # React frontend
│   ├── components/      # Reusable UI components
│   ├── pages/           # Route page components
│   ├── lib/             # Utilities, auth context, query client
│   └── hooks/           # Custom React hooks
├── server/              # Express backend
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Database operations layer
│   ├── paypal.ts        # Payment integration
│   └── db.ts            # Database connection
├── shared/              # Shared code between client/server
│   └── schema.ts        # Drizzle schema definitions
└── migrations/          # Database migrations
```

## External Dependencies

### Payment Processing
- **PayPal Server SDK**: Handles subscription payments for membership tiers
- **Configuration**: Requires `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` environment variables
- **Mode**: Sandbox in development, Production when `NODE_ENV=production`

### Database
- **PostgreSQL**: Primary database
- **Connection**: Via `DATABASE_URL` environment variable
- **ORM**: Drizzle ORM with node-postgres driver

### Third-Party UI Libraries
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, tabs, etc.)
- **Recharts**: Data visualization for dashboard performance tracking
- **lightweight-charts**: TradingView-style candlestick charts for simulator
- **react-hook-form**: Form handling with Zod validation
- **date-fns**: Date formatting utilities

### Development Tools
- **Replit Plugins**: vite-plugin-runtime-error-modal, vite-plugin-cartographer, vite-plugin-dev-banner
- **Google Fonts**: Inter, DM Sans, Space Grotesk, Geist Mono for typography