# HSA Songbook

A Progressive Web App (PWA) for managing worship songs and chord arrangements, designed for worship teams.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Convex (real-time database + auth)
- **Styling**: TailwindCSS + shadcn/ui (earth-tone color palette)
- **Editor**: CodeMirror 6 (ChordPro syntax highlighting)
- **PWA**: vite-plugin-pwa + Workbox
- **File Storage**: Cloudflare R2 (profile pictures)

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
│   ├── chordpro/  # ChordPro editor (CodeMirror 6)
│   ├── setlists/  # Setlist management
│   ├── groups/    # Groups and membership
│   ├── versions/  # Version history
│   ├── profile/   # User profiles
│   ├── browse/    # Song browsing with filters
│   ├── search/    # Search and discovery
│   ├── settings/  # User settings
│   ├── favorites/ # Favorites system
│   ├── audio/     # Audio player and media
│   ├── appearance/# Theme and font customization
│   ├── pwa/       # PWA/offline functionality
│   └── shared/    # Shared components
├── lib/           # Utilities, theme config
└── types/         # TypeScript types

convex/
├── schema.ts      # Database schema
├── auth.ts        # Auth configuration
├── songs.ts       # Song queries/mutations
├── arrangements.ts # Arrangement queries/mutations
├── setlists.ts    # Setlist queries/mutations
├── groups.ts      # Group queries/mutations
├── versions.ts    # Version history
├── permissions.ts # Permission helpers
├── files.ts       # R2 file storage
├── favorites.ts   # Favorites (arrangements & setlists)
├── userAppearancePreferences.ts # Theme/font settings
└── seed.ts        # Seed scripts
```

## Features

- **PWA** - Installable app with offline UI caching
- **Real-time sync** - Changes sync instantly across devices via Convex
- **Authentication** - Anonymous (view-only) or email/password (full access)
- **Song management** - Add songs with themes, origin, lyrics, notes, bible verses, and quotes
- **Chord arrangements** - ChordPro editor with syntax highlighting and transposition
- **Setlists** - Create and manage setlists with drag-drop ordering and custom keys per song
- **Public setlists** - Share setlists publicly or via link, browse community setlists
- **Performance mode** - Fullscreen chord display with swipe/keyboard navigation
- **Groups & permissions** - Share content with groups, collaborators, and the Community
- **Version history** - Rollback Community-owned content to previous versions
- **Favorites** - Heart arrangements and setlists to build your collection
- **User profiles** - Profile pages with avatars and arrangement history
- **Theme discovery** - Browse songs by worship themes (praise, thanksgiving, etc.)
- **Audio/media** - Attach MP3 files or YouTube videos to arrangements
- **Appearance customization** - Theme colors, fonts, and chord styling preferences
- **Dark/light mode** - System-aware theme with manual toggle

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
