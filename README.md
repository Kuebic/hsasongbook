# HSA Songbook

A Progressive Web App (PWA) for managing worship songs and chord arrangements.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Convex (real-time database + auth)
- **Styling**: TailwindCSS + shadcn/ui
- **PWA**: vite-plugin-pwa + Workbox

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd hsasongbook
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Convex:
   ```bash
   npx convex dev
   ```
   This will prompt you to log in and create a project. It will create `.env.local` with your deployment URL.

4. Add the Convex URL to your environment:
   ```bash
   # .env.local (created by npx convex dev)
   CONVEX_DEPLOYMENT=...
   VITE_CONVEX_URL=<your-convex-deployment-url>
   ```

### Development

Run both the Vite dev server and Convex in parallel:

```bash
# Terminal 1: Start Convex backend
npx convex dev

# Terminal 2: Start Vite frontend
npm run dev
```

The app will be available at `http://localhost:5173`.

## Project Structure

```
src/
├── app/           # App entry point and routing
├── components/    # shadcn/ui components
├── features/      # Feature modules
│   ├── auth/      # Authentication (Convex Auth)
│   ├── songs/     # Song management
│   ├── arrangements/ # Chord arrangements
│   ├── setlists/  # Setlist management
│   ├── pwa/       # PWA/offline functionality
│   └── ...
├── lib/           # Utilities and config
└── types/         # TypeScript types

convex/
├── schema.ts      # Database schema
├── auth.ts        # Auth configuration
├── auth.config.ts # Auth providers
└── http.ts        # HTTP routes
```

## Features

- Offline-first PWA architecture
- Anonymous + email/password authentication
- Song and chord arrangement management
- Setlist creation for performances
- ChordPro format support
- Dark/light theme

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript check

## Seed Functions

Seed functions are used to set up initial data. Use `--prod` flag for production deployment.

### Database Seeding

```bash
# Seed full database (dev only)
npx convex run seed:seedDatabase

# Clear all data (dev only)
npx convex run seed:clearDatabase
```

### Community Group Setup

The Community group is a system group for shared/crowdsourced content.

```bash
# Create the Community group (required before using community features)
npx convex run seed:seedCommunityGroup           # dev
npx convex run seed:seedCommunityGroup --prod    # prod

# Make Community group open (no approval required to join)
npx convex run seed:makeCommunityGroupOpen           # dev
npx convex run seed:makeCommunityGroupOpen --prod    # prod

# Add a user as admin by username
npx convex run seed:addUserToCommunityGroupByUsername '{"username": "their_username"}'           # dev
npx convex run seed:addUserToCommunityGroupByUsername --prod '{"username": "their_username"}'    # prod

# Add a user as admin by user ID
npx convex run seed:addMeToCommunityGroup '{"userId": "USER_ID"}'           # dev
npx convex run seed:addMeToCommunityGroup --prod '{"userId": "USER_ID"}'    # prod
```
