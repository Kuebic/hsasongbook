# HSA Songbook - Project Status & MVP Roadmap

**Last Updated**: 2026-01-21
**Current Phase**: 5 (Cloud Integration with Convex) - In Progress
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
- **Local Storage**: IndexedDB (idb library)

---

## Key Decisions (Confirmed 2026-01-21)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Seed data** | Start fresh (no migration) | Simplifies MVP, can add seed data later |
| **Anonymous users** | View-only access | Must sign up to create arrangements/setlists |
| **MVP scope** | Songs + Arrangements | Both are core to the app's value |
| **Conflict resolution** | Use Convex's built-in OCC | Automatic retries, no custom UI needed |
| **Offline writes** | Online-only for MVP | Editing requires connection; offline = view only |
| **Testing** | No extensive testing for MVP | Ship fast, iterate based on real usage |
| **Timeline** | ASAP | Solid skeleton > feature completeness |

---

## Current Status Summary

### What's DONE (Phases 1-4.5)

| Feature | Status | Notes |
|---------|--------|-------|
| Offline-first PWA | ✅ Complete | Service workers, caching, IndexedDB |
| Browse songs/arrangements | ✅ Complete | Mock data with search |
| ChordPro editor | ✅ Complete | CodeMirror, auto-save, split-view |
| Setlist management | ✅ Complete | Drag-drop, performance mode |
| Dark/light theme | ✅ Complete | System detection, persistence |
| URL slugs | ✅ Complete | SEO-friendly navigation |
| Navigation UI | ✅ Complete | Desktop header + mobile bottom nav |
| Keyboard shortcuts | ✅ Complete | Global shortcut system |

### What's IN PROGRESS (Phase 5 - Convex Migration)

| Feature | Status | Notes |
|---------|--------|-------|
| Convex backend setup | ✅ Complete | Replaced Supabase |
| Anonymous auth | ✅ Complete | View-only for anonymous users |
| Email/password auth | ✅ Complete | No email verification (MVP) |
| AuthProvider w/ Convex | ✅ Complete | Fetches real user data |
| **Convex schema (songs, arrangements, setlists)** | ❌ NOT STARTED | Only auth tables exist |
| **Real-time sync with Convex** | ❌ NOT STARTED | Replace IndexedDB as source of truth |
| **"Add Song" form** | ❌ NOT STARTED | For authenticated users |
| **"Add Arrangement" form** | ❌ NOT STARTED | For authenticated users |

### What's PLANNED (Phase 6+)

- OAuth (Google/Apple Sign-In)
- User profiles & social features
- Comments & community ratings
- Magic link authentication

---

## Architecture Overview

### Current State (Mixed - needs migration)
```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (PWA)                     │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│      IndexedDB          │     │        Convex           │
│   (Mock data, drafts)   │     │      (Auth only)        │
│  ├─ songs (mock)        │     │  └─ users               │
│  ├─ arrangements (mock) │     │                         │
│  ├─ setlists            │     │                         │
│  └─ chordproDrafts      │     │                         │
└─────────────────────────┘     └─────────────────────────┘
```

### Target State (MVP)
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
│    (Local cache only)   │     │  ├─ users               │
│  └─ chordproDrafts      │     │  ├─ songs               │
│                         │     │  ├─ arrangements        │
│                         │     │  └─ setlists            │
└─────────────────────────┘     └─────────────────────────┘
```

### Offline Strategy
- **Viewing**: Service worker caches UI + previously loaded data
- **Setlists**: Loading a setlist pre-caches all its songs/arrangements for offline use
- **Creating/Editing**: Requires internet connection (MVP)
- **Future**: Offline queue for writes (post-MVP if needed)

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

### Convex Schema (To Be Created)

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
})
  .index("by_song", ["songId"])
  .index("by_slug", ["slug"])
  .index("by_creator", ["createdBy"])

// setlists - Private to user
setlists: defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  performanceDate: v.optional(v.string()),
  arrangementIds: v.array(v.id("arrangements")),
  userId: v.id("users"),
})
  .index("by_user", ["userId"])
```

---

## Remaining Work for MVP

### Phase 5.1: Convex Schema & Queries
- [ ] Add songs, arrangements, setlists tables to `convex/schema.ts`
- [ ] Create queries: `songs.list`, `songs.get`, `arrangements.bySong`, etc.
- [ ] Create mutations: `songs.create`, `arrangements.create`, etc.
- [ ] Add proper auth checks (authenticated users only for writes)

### Phase 5.2: Frontend Integration
- [ ] Replace IndexedDB reads with Convex `useQuery` hooks
- [ ] Update song/arrangement browse pages to use Convex data
- [ ] Wire existing components to Convex mutations
- [ ] Keep IndexedDB only for `chordproDrafts` (editor auto-save)

### Phase 5.3: Add Song/Arrangement Forms
- [ ] Build "Add Song" form (title, artist, themes, lyrics)
- [ ] Build "Add Arrangement" form (key, tempo, capo, ChordPro content)
- [ ] Auto-generate URL slugs from title/name
- [ ] Show forms only for authenticated users

### Phase 5.4: Auth Gating & Polish
- [ ] Gate create/edit actions behind auth check
- [ ] Show "Sign in to create" prompts for anonymous users
- [ ] Add loading states and error handling
- [ ] Verify real-time sync works across tabs/devices

---

## Key Files

| Purpose | Path |
|---------|------|
| Main App | `src/app/App.tsx` |
| Auth Provider | `src/features/auth/context/AuthProvider.tsx` |
| Convex Schema | `convex/schema.ts` |
| Convex Auth | `convex/auth.ts` |
| IndexedDB (keep for drafts) | `src/features/pwa/db/database.ts` |
| Type Definitions | `src/types/` |

---

## Success Criteria for MVP

### Must Have
- [ ] Users can browse songs and arrangements (works for everyone)
- [ ] Authenticated users can create songs
- [ ] Authenticated users can create arrangements for songs
- [ ] Data persists in Convex (not just local)
- [ ] Real-time updates across devices
- [ ] Anonymous users see "Sign in to create" prompts

### Nice to Have (Post-MVP)
- [ ] Setlist management wired to Convex
- [ ] Ratings/favorites on arrangements
- [ ] User profile pages
- [ ] Search improvements

---

## Open Questions (Resolved)

| Question | Answer |
|----------|--------|
| Mock data migration? | ✅ Start fresh |
| Anonymous user data? | ✅ Anonymous = view only, no data to migrate |
| Add Song + Arrangement? | ✅ Both needed for MVP |
| Conflict resolution? | ✅ Convex handles it automatically |
| Offline writes? | ✅ Online-only for MVP; offline = view cached data |
| Testing? | ✅ Minimal for MVP |
| Timeline? | ✅ ASAP, don't sacrifice security |

---

## Document History

| Date | Change |
|------|--------|
| 2026-01-21 | Updated with confirmed decisions, simplified architecture |
| 2026-01-21 | Initial project status document created |
| 2025-10-14 | Phase 5 architecture decisions approved (pre-Convex pivot) |
| 2025-01 | Pivoted from Supabase to Convex |
