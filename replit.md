# 12Digits Trading Education Platform

## Overview

12Digits is a professional trading education platform that provides real-time market simulation, structured lessons, and comprehensive tools for learning to trade. The platform targets three membership tiers: School (for educators/students), Casual (individual learners), and 12Digits+ (premium features). 

**Casual Tier Features** (Free):
- Lessons, Simulator, Dashboard, Leaderboard, Achievements
- Watchlist - Track favorite stocks with price monitoring
- Trading Tips - Daily tips and market insights

**All Logged-In Features** (all tiers):
- Strategies - Strategy library (no paywall, accessible to all users)
- Risk Calculator - Accessible from main navbar for all users

**Premium Features** (12Digits+ or Trial Users):
- Command Center (Terminal), Analytics
- Trade Journal, News Feed, Economic Calendar
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
- **Trial Access**: 14-day trial is available to new teacher/casual/premium users only. Students (role=student) do NOT receive a trial — they must be enrolled in a class by a teacher to gain access.

### Simulated Stock Prices
- Prices stored in-memory in `storage.ts` (`simulatedPrices: Record<string,number>`)
- Default seed prices set on startup: AAPL ($185.50), MSFT ($415.20), BTC ($43,250), etc.
- Updated via `POST /api/simulated-prices/update`; retrieved via `GET /api/simulated-prices`

### Simulator Chart
- Uses lightweight-charts (TradingView library) for candlestick charts
- Text color explicitly set based on dark/light mode detection (`document.documentElement.classList.contains('dark')`) to ensure timestamp visibility in both modes

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

## School System (School World)

The School System is a completely separate, immersive visual environment at `/school/*` routes. It has its own layout (`client/src/layouts/school-layout.tsx`) with distinct sidebar, branding, and CSS theme (`school-world` class in `index.css`). The main navbar shows a "School World" button for users with `membershipTier === "school"`. School pages skip the main Navbar entirely (handled in `AppContent` in `App.tsx`).

### Routes
- `/school` — Hub/entry page (`pages/school/hub.tsx`)
- `/school/student` — Age-adapted student dashboard (`pages/school/student-dashboard.tsx`)
- `/school/teacher` — Teacher Command Centre (`pages/school/teacher-dashboard.tsx`)
- `/school/fun-zone` — Age-adapted Fun Zone with mini-games (`pages/school/fun-zone.tsx`)
- `/school/simulator` — School-themed trading simulator with 5 chart themes & 3 layouts (`pages/school/simulator.tsx`)
- `/school/leaderboard` — Class-scoped + global leaderboard with medals (`pages/school/leaderboard.tsx`)
- `/school/lessons` — School-themed lesson grid with progress bars (`pages/school/lessons.tsx`)
- `/school/chat` — Per-class group chat; teachers can post announcements (`pages/school/chat.tsx`)

### Age Groups (defined in `shared/schema.ts`)
- `primary` (ages 6–10): Colorful, large emojis, coin animations, simple words
- `intermediate` (ages 11–13): Badges, progress bars, portfolio basics
- `high_school` (ages 14–18): Full interface — charts, trades, complex assignments

### School Features
- **Join Code Enrollment**: `POST /api/classroom/join` with `{ joinCode }` — students enter teacher-given code to join class. Register page shows join code step after signup. Hub shows join code prompt for students with no class.
- **Classroom Tokens**: Stored as `classroomTokens` on users table; awarded by Fun Zone games
- **Market Events**: Teachers post boom/crash/news/tip events to classes
- **Assignments**: profit_target, lesson_completion, portfolio_balance types with student progress tracking
- **Class Group Chat**: `classGroupMessages` table (classId, senderId, content, messageType). `GET/POST /api/classroom/chat`. Teacher can post announcements (pinned card styling). Polls every 3s.
- **Class Leaderboard**: Rankings scoped to class via `/api/leaderboard?scope=class`
- **Fun Zone Games**: Age-adapted mini-games (Coin Rain, Piggy Bank Builder, Stock Guesser, Budget Boss, Finance Quiz, Market Prediction, Investment Quiz, Strategy Challenge)
- **Simulator Settings**: Persisted to `localStorage["school-sim-settings"]` — theme (default/neon/ocean/sunset/matrix), layout (standard/compact/wide), showGrid, showVolume
- **School World Economy**: Full virtual classroom economy. Tables: `economySettings`, `economyBalances`, `economyTransactions`, `economySavings`, `economyJobs`, `economyExpenses`, `economyAuctions`, `economyAuctionBids`, `economyStoreItems`, `economyPurchases`, `economyChallenges`, `classroomAssets`, `studentAssets`.
  - Students: earn coins from lessons (50), quizzes (25 if ≥60%), assignments (100); manage savings with interest; bid in auctions; buy from store; purchase assets (property/business/investment) that add to net worth and generate passive income; view net worth breakdown and class leaderboard.
  - Teachers (via EconomyTab in teacher dashboard): create/delete jobs, expenses, auctions, store items, assets, challenges; trigger economy events (bonus/fine/fine-percent/interest); award coins to students; process asset income; configure currency name/symbol/rewards.
  - Simulator profits auto-convert to economy coins via `/api/economy/convert-profit` (configurable rate in economy settings).
  - Net worth = cash + savings + simulator balance + asset portfolio value - outstanding loan balances. Simulator balance shown separately in net worth breakdown as USD ($).
  - **Loans**: Teachers issue loans (`POST /api/economy/loans`) to students with configurable amount, interest rate %, and due date. Students repay via `/api/economy/loans/:id/repay`. Teachers trigger interest accrual via `/api/economy/loans/apply-interest`. Outstanding loans appear in student wallet tab and reduce net worth. Paid-off loans shown in history. `economy_loans` table: id, classId, studentId, principal, balance, interestRate, isActive, dueDate.
  - API prefix: `/api/economy/*`. Routes include assets, my-assets, net-worth, net-worth-leaderboard, process-asset-income.
  - Student economy page: `/school/economy` (5 tabs: Wallet, Assets, Auctions, Store, Rankings).

## Casual Plan Features

Users with `membershipTier === "casual"` get distinct features:
- **Portfolio Analysis** at `/casual/portfolio` (`pages/casual-portfolio-analysis.tsx`) — P&L history, sector breakdown, risk metrics (win rate, risk/reward, expectancy, profit factor, max drawdown), cumulative P&L sparkline
- **Friends** — prominently shown in navbar for casual users
- **`casual-world` CSS class** — applied to the root div in AppContent for casual users; defines `--casual-accent` CSS variable
- Navbar: Friends and Portfolio buttons highlighted in purple for casual users (both desktop and mobile/dropdown)

## External Dependencies

### Payment Processing
- **PayPal Server SDK**: Handles subscription payments for membership tiers
- **Configuration**: Requires `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` environment variables
- **Mode**: Sandbox in development, Production when `NODE_ENV=production`

### Database
- **PostgreSQL**: Primary database
- **Connection**: Via `DATABASE_URL` environment variable
- **ORM**: Drizzle ORM with node-postgres driver

### Object Storage (S3-Compatible)
- **Purpose**: User avatar uploads and file storage
- **Configuration**: Works with AWS S3, Cloudflare R2, DigitalOcean Spaces, or any S3-compatible service
- **Required Environment Variables**:
  - `S3_BUCKET` - Bucket name
  - `S3_REGION` - AWS region (default: us-east-1)
  - `S3_ACCESS_KEY_ID` - Access key
  - `S3_SECRET_ACCESS_KEY` - Secret key
  - `S3_ENDPOINT` - (Optional) Custom endpoint for non-AWS S3 services

### Stock Market Data
- **Finnhub API**: Real-time stock quotes and market data
- **Configuration**: Requires `FINNHUB_API_KEY` environment variable

### Firebase Authentication (Optional)
- **Purpose**: Google sign-in authentication
- **Required Environment Variables**:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_APP_ID`

### Third-Party UI Libraries
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, tabs, etc.)
- **Recharts**: Data visualization for dashboard performance tracking
- **lightweight-charts**: TradingView-style candlestick charts for simulator
- **react-hook-form**: Form handling with Zod validation
- **date-fns**: Date formatting utilities

### Development Tools
- **Replit Plugins**: vite-plugin-runtime-error-modal, vite-plugin-cartographer, vite-plugin-dev-banner
- **Google Fonts**: Inter, DM Sans, Space Grotesk, Geist Mono for typography