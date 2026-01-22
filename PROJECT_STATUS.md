# HSA Songbook - Project Status & MVP Roadmap

**Last Updated**: 2026-01-22
**Current Phase**: 5 (Cloud Integration with Convex) - Phase 5.4 Complete
**Goal**: MVP ASAP - solid skeleton, secure foundation

---

## Project Overview

HSA Songbook is a Progressive Web App (PWA) for managing worship songs and chord arrangements. It's designed for worship teams with an **offline-first architecture** and recently transitioned from **Supabase to Convex** for backend infrastructure.

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Convex (real-time database + auth)
- **Styling**: TailwindCSS + shadcn/ui
- **PWA**: vite-plugin-pwa + Workbox
- **Editor**: CodeMirror 6 (ChordPro)
- **Local Storage**: IndexedDB (for chordproDrafts only)

---

## Key Decisions (Confirmed 2026-01-21)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Seed data** | Convex seed script | Run `npx convex run seed:seedDatabase` to populate |
| **Anonymous users** | View-only access | Must sign up to create arrangements/setlists |
| **MVP scope** | Songs + Arrangements | Both are core to the app's value |
| **Conflict resolution** | Use Convex's built-in OCC | Automatic retries, no custom UI needed |
| **Offline writes** | Online-only for MVP | Editing requires connection; offline = view only |
| **Testing** | No extensive testing for MVP | Ship fast, iterate based on real usage |
| **Timeline** | ASAP | Solid skeleton > feature completeness |
| **Recently viewed** | Skipped for MVP | Simplifies migration |

---

## Current Status Summary

### What's DONE (Phases 1-5.2)

| Feature | Status | Notes |
|---------|--------|-------|
| Offline-first PWA | ✅ Complete | Service workers, caching |
| Browse songs/arrangements | ✅ Complete | Now uses Convex real-time data |
| ChordPro editor | ✅ Complete | CodeMirror, auto-save, split-view |
| Setlist management | ✅ Complete | Drag-drop, performance mode (uses IndexedDB still) |
| Dark/light theme | ✅ Complete | System detection, persistence |
| URL slugs | ✅ Complete | SEO-friendly navigation |
| Navigation UI | ✅ Complete | Desktop header + mobile bottom nav |
| Keyboard shortcuts | ✅ Complete | Global shortcut system |
| Convex backend setup | ✅ Complete | Replaced Supabase |
| Anonymous auth | ✅ Complete | View-only for anonymous users |
| Email/password auth | ✅ Complete | No email verification (MVP) |
| AuthProvider w/ Convex | ✅ Complete | Fetches real user data |
| Convex schema | ✅ Complete | songs, arrangements, setlists tables |
| **Frontend Convex integration** | ✅ Complete | All pages use Convex queries/mutations |
| **Seed script** | ✅ Complete | `convex/seed.ts` for initial data |

### What's DONE (Phase 5.3)

| Feature | Status | Notes |
|---------|--------|-------|
| **"Add Song" form** | ✅ Complete | Modal dialog with title, artist, themes, lyrics |
| **"Add Arrangement" form** | ✅ Complete | Modal dialog with name, key, capo, tags |
| **Auth gating** | ✅ Complete | "Sign in to create" prompts for anonymous users |
| **Random arrangement slugs** | ✅ Complete | 6-char nanoid for stable URLs |

### What's PLANNED (Phase 5.4+)

- OAuth (Google/Apple Sign-In)
- Setlist management wired to Convex
- User profiles & social features

---

## Architecture Overview

### Current State (Phase 5.2 Complete)
```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (PWA)                     │
│         Anonymous = View Only | Signed In = Full Access     │
│              Offline = View Only (cached data)              │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│      IndexedDB          │     │     Convex (Primary)    │
│    (Local drafts only)  │     │  ├─ users               │
│  └─ chordproDrafts      │     │  ├─ songs               │
│                         │     │  ├─ arrangements        │
│                         │     │  └─ setlists            │
└─────────────────────────┘     └─────────────────────────┘
```

### Offline Strategy
- **Viewing**: Service worker caches UI shell; Convex data requires connection
- **Setlists**: No offline support yet (see Architecture Notes for post-MVP plan)
- **Creating/Editing**: Requires internet connection (MVP)
- **Future**: "Download for Offline" feature for setlists (post-MVP)

---

## How Convex Handles Conflicts

**Good news**: Convex uses Optimistic Concurrency Control (OCC) with automatic retries. We don't need to build custom conflict resolution UI.

### How it works:
1. Each mutation is treated as a "proposal" based on what data was read
2. If another write happened concurrently, Convex detects the conflict
3. Convex **automatically retries** the mutation with fresh data
4. Mutations are deterministic, so retries always succeed
5. Result: True serializability without developer intervention

### What this means for us:
- ❌ No need for version fields or conflict detection logic
- ❌ No need for "Keep Mine / Use Server" modal
- ✅ Just write mutations normally, Convex handles the rest
- ✅ Real-time subscriptions keep all clients in sync

Sources: [Convex OCC Docs](https://docs.convex.dev/database/advanced/occ), [How Convex Works](https://stack.convex.dev/how-convex-works)

---

## Data Model

### Ownership & Access Rules
| Entity | Read Access | Write Access |
|--------|-------------|--------------|
| **Songs** | Everyone (including anonymous) | Authenticated users only |
| **Arrangements** | Everyone | Creator only |
| **Setlists** | Creator only | Creator only |

### Convex Schema (Implemented)

```typescript
// songs - Global community library
songs: defineTable({
  title: v.string(),
  artist: v.optional(v.string()),
  themes: v.array(v.string()),
  copyright: v.optional(v.string()),
  lyrics: v.optional(v.string()),
  slug: v.string(),
  createdBy: v.id("users"),
})
  .index("by_slug", ["slug"])
  .index("by_title", ["title"])
  .index("by_createdBy", ["createdBy"])

// arrangements - User-owned versions of songs
arrangements: defineTable({
  songId: v.id("songs"),
  name: v.string(),
  key: v.optional(v.string()),
  tempo: v.optional(v.number()),
  capo: v.optional(v.number()),
  timeSignature: v.optional(v.string()),
  chordProContent: v.string(),
  slug: v.string(),
  createdBy: v.id("users"),
  rating: v.number(),           // Social: 0-5
  favorites: v.number(),        // Social: count
  tags: v.array(v.string()),    // Social: tags
  updatedAt: v.optional(v.number()),
})
  .index("by_slug", ["slug"])
  .index("by_song", ["songId"])
  .index("by_createdBy", ["createdBy"])

// setlists - Private to user
setlists: defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  performanceDate: v.optional(v.string()),
  arrangementIds: v.array(v.id("arrangements")),
  userId: v.id("users"),
  updatedAt: v.optional(v.number()),
})
  .index("by_user", ["userId"])
```

### Convex API (Implemented)

| Module | Queries | Mutations |
|--------|---------|-----------|
| `songs` | `list`, `get`, `getBySlug`, `count` | `create` |
| `arrangements` | `list`, `get`, `getBySlug`, `getBySong`, `count`, `getFeatured`, `getFeaturedWithSongs` | `create`, `update` |
| `setlists` | `list`, `get`, `getWithArrangements` | `create`, `update`, `remove` |
| `seed` | - | `seedDatabase`, `clearDatabase` |

---

## Remaining Work for MVP

### Phase 5.1: Convex Schema & Queries ✅ COMPLETE
- [x] Add songs, arrangements, setlists tables to `convex/schema.ts`
- [x] Create queries: `songs.list`, `songs.get`, `arrangements.getBySong`, etc.
- [x] Create mutations: `songs.create`, `arrangements.create`, etc.
- [x] Add proper auth checks (authenticated users only for writes)

### Phase 5.2: Frontend Integration ✅ COMPLETE
- [x] Replace IndexedDB reads with Convex `useQuery` hooks
- [x] Update song/arrangement browse pages to use Convex data
- [x] Wire existing components to Convex mutations
- [x] Keep IndexedDB only for `chordproDrafts` (editor auto-save)
- [x] Create Convex seed script for initial data
- [x] Remove recently viewed feature (skipped for MVP)

### Phase 5.3: Add Song/Arrangement Forms ✅ COMPLETE
- [x] Build "Add Song" form (title, artist, themes, lyrics)
- [x] Build "Add Arrangement" form (key, tempo, capo, ChordPro content)
- [x] Implement short random ID slugs for arrangements (6-char nanoid)
- [x] Human-readable slugs for songs (generated from title)
- [x] Gate create/edit actions behind auth check
- [x] Show "Sign in to create" prompts for anonymous users

### Phase 5.4: Setlists & Polish ✅ COMPLETE
- [x] Wire setlist management to Convex (replaced IndexedDB)
- [x] Add auth gating for setlist pages
- [x] Real-time sync works across tabs/devices (Convex built-in)

### Phase 5.5: OAuth & Additional Features (Next)
- [ ] OAuth (Google/Apple Sign-In)
- [ ] User profiles & social features

---

## Key Files

| Purpose | Path |
|---------|------|
| Main App | `src/app/App.tsx` |
| Auth Provider | `src/features/auth/context/AuthProvider.tsx` |
| Convex Schema | `convex/schema.ts` |
| Convex Auth | `convex/auth.ts` |
| Convex Songs API | `convex/songs.ts` |
| Convex Arrangements API | `convex/arrangements.ts` |
| Convex Setlists API | `convex/setlists.ts` |
| **Convex Seed Script** | `convex/seed.ts` |
| IndexedDB (drafts only) | `src/features/pwa/db/database.ts` |
| Type Definitions | `src/types/` |

---

## How to Seed the Database

Run the following command to populate the database with initial song and arrangement data:

```bash
npx convex run seed:seedDatabase
```

To clear all data (for testing):

```bash
npx convex run seed:clearDatabase
```

---

## Success Criteria for MVP

### Must Have
- [x] Users can browse songs and arrangements (works for everyone)
- [x] Authenticated users can create songs
- [x] Authenticated users can create arrangements for songs
- [x] Data persists in Convex (not just local)
- [x] Real-time updates across devices
- [x] Anonymous users see "Sign in to create" prompts

### Post-MVP Roadmap

#### 🐛 Bugs

| Issue | Description |
|-------|-------------|
| **Bb/A# key mismatch** | Selecting Bb as arrangement key displays as A# instead |
| **Fullscreen exit broken** | ESC exits browser fullscreen but not editor fullscreen mode; must click unfullscreen icon |
| **Dark mode in editor** | Chord typing area doesn't respect dark mode theme |

#### 🔐 Permissions & Ownership

| Feature | Description |
|---------|-------------|
| **Restrict editing to owners** | Users should only edit their own arrangements; viewing others' should prompt "duplicate to edit" |
| **Edit song details** | Allow editing title, artist, themes, lyrics (at minimum by creator; consider crowdsourcing with moderation) |
| **Delete own arrangements** | Allow users to delete arrangements they created |
| **Duplicate arrangements** | Copy another user's arrangement as your own to customize |

#### 👤 User & Social Features

| Feature | Description |
|---------|-------------|
| **Show arrangement creator** | Display username on arrangements |
| **User profile pages** | View user's created arrangements |
| **Filter by "my arrangements"** | On song page, filter to show only your arrangements |
| **Ratings & favorites UI** | Like/rate arrangements, especially from within arrangement view |

#### 🎹 Setlist Enhancements

| Feature | Description |
|---------|-------------|
| **Offline setlist caching** | "Download for Offline" for performance mode (see Architecture Notes) |
| **Custom key per setlist entry** | Override arrangement key for specific setlist songs |
| **Notes per setlist entry** | Add performance notes to individual setlist songs |

#### ✏️ Editor UX Improvements

| Feature | Description |
|---------|-------------|
| **Debounce error alerts** | Don't show syntax errors mid-typing (e.g., unclosed `[]`) |
| **Clarify save/undo buttons** | Document or fix save button behavior (auto-save?); verify undo/redo works |
| **Better navigation from editor** | Add direct "back to arrangement" link instead of going through song page |
| **Remove arrangement switcher** | Remove bottom-corner arrangement nav in editor; use song page instead |

#### 🔍 Search & Input Improvements

| Feature | Description |
|---------|-------------|
| **Song title autocomplete** | When adding song, suggest existing titles to prevent duplicates |
| **Tag chips with autocomplete** | Replace comma-separated text with chip UI; enforce lowercase, hyphens instead of spaces |
| **Server-side search** | Move search filtering to Convex query for scale |

#### 🎵 Key Selection UX

| Feature | Description |
|---------|-------------|
| **Fix key dropdown overflow** | "All keys" section gets cut off |
| **Better enharmonic handling** | Show both sharp/flat variants (C#/Db) or use Planning Center-style picker |

### Technical Debt

| Issue | Fix |
|-------|-----|
| **N+1 query in SongList** | Add `arrangements.countBySong` query instead of fetching all arrangements |
| **Duplicated type mappers** | Extract `mapConvexArrangement`/`mapConvexSong` to shared `convex/mappers.ts` |
| **Convex ID type casting** | Reduce `as Id<'setlists'>` casts by typing IDs upstream |
| **No-op `reload()` functions** | Remove from `useSetlistData`/`useSetlists` (Convex auto-syncs) |
| **Stubbed `updateSongKey`** | Remove from interface or throw error instead of logging warning |

---

## Open Questions (Resolved)

| Question | Answer |
|----------|--------|
| Mock data migration? | ✅ Use Convex seed script |
| Anonymous user data? | ✅ Anonymous = view only, no data to migrate |
| Add Song + Arrangement? | ✅ Both needed for MVP |
| Conflict resolution? | ✅ Convex handles it automatically |
| Offline writes? | ✅ Online-only for MVP; offline = view cached data |
| Testing? | ✅ Minimal for MVP |
| Timeline? | ✅ ASAP, don't sacrifice security |
| Recently viewed? | ✅ Skipped for MVP |

---

## Architecture Notes (Post-MVP)

### Offline Performance Mode

**Problem**: Convex uses WebSockets for real-time data. Service workers cache the UI shell, but Convex queries return nothing when offline. This is fine for general browsing (annoying but acceptable), but **unacceptable for mid-performance** when going through a setlist.

**Current state**:
- ✅ `useOnlineStatus` hook with connectivity detection
- ✅ `OfflineIndicator` component for UI feedback
- ✅ Service worker caches UI shell
- ❌ No explicit "save setlist for offline" mechanism

**Proposed solution**: Explicit "Download for Offline" feature
1. Add "Save for Offline" button on setlist detail page
2. Fetch full setlist data via `getWithArrangements` query
3. Store snapshot in IndexedDB (new table: `offlineSetlists`)
4. Performance mode reads from IndexedDB when offline, Convex when online
5. Show "Available Offline" badge on downloaded setlists
6. Optional: background refresh when online to keep cache fresh

**Key rules**:
- Convex remains source of truth (IndexedDB is read-only cache)
- No offline editing (avoids sync conflicts)
- Clear staleness indicator if cached data is old

**Why not automatic caching?**
- Explicit download is simpler to implement and reason about
- User knows what's available offline
- Avoids filling device storage unexpectedly

**Existing infrastructure to reuse**:
- `src/features/pwa/db/database.ts` - IndexedDB setup (currently for drafts)
- `src/features/pwa/hooks/useOnlineStatus.ts` - Connection detection
- `convex/setlists.ts:getWithArrangements` - Fetches full setlist data

---

## Document History

| Date | Change |
|------|--------|
| 2026-01-22 | **Phase 5.4 complete**: Setlist management migrated to Convex with auth gating |
| 2026-01-22 | Added Architecture Notes section for offline performance mode design |
| 2026-01-22 | Added CLAUDE.md for AI assistant context |
| 2026-01-21 | **Phase 5.3 complete**: Add Song/Arrangement forms with auth gating |
| 2026-01-21 | **Phase 5.2 complete**: Frontend now uses Convex for all data |
| 2026-01-21 | Added Convex seed script, removed mock data migration |
| 2026-01-21 | Removed recently viewed feature (skip for MVP) |
| 2026-01-21 | Phase 5.1 complete: Convex schema + queries + mutations |
| 2026-01-21 | Updated with confirmed decisions, simplified architecture |
| 2026-01-21 | Initial project status document created |
| 2025-10-14 | Phase 5 architecture decisions approved (pre-Convex pivot) |
| 2025-01 | Pivoted from Supabase to Convex |
