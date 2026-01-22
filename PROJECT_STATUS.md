# HSA Songbook - Project Status & MVP Roadmap

**Last Updated**: 2026-01-22
**Current Phase**: 5.5 (User Display & Profiles)
**Goal**: MVP ASAP - solid skeleton, secure foundation

---

## Project Overview

HSA Songbook is a Progressive Web App (PWA) for managing worship songs and chord arrangements, designed for worship teams.

### Architecture
- **Data**: Convex is the source of truth with real-time sync across devices
- **Offline**: PWA caches UI shell for fast loading; data requires connection
- **Auth**: Anonymous (view-only) or authenticated (full access)

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript + Vite |
| Backend | Convex (real-time DB + auth) |
| Styling | TailwindCSS + shadcn/ui |
| Editor | CodeMirror 6 (ChordPro syntax) |
| PWA | vite-plugin-pwa + Workbox |
| Local Storage | IndexedDB (editor drafts only) |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Seed data** | Convex seed script | Run `npx convex run seed:seedDatabase` to populate |
| **Anonymous users** | View-only access | Must sign up to create arrangements/setlists |
| **MVP scope** | Songs + Arrangements | Both are core to the app's value |
| **Conflict resolution** | Use Convex's built-in OCC | Automatic retries, no custom UI needed |
| **Offline writes** | Online-only for MVP | Editing requires connection; offline = view only |
| **Testing** | No extensive testing for MVP | Ship fast, iterate based on real usage |

---

## Completed Phases Summary

### Phases 1-5.4 ✅ COMPLETE

| Feature | Status |
|---------|--------|
| PWA with cached UI shell | ✅ |
| Browse songs/arrangements (Convex real-time) | ✅ |
| ChordPro editor with CodeMirror | ✅ |
| Setlist management with drag-drop | ✅ |
| Dark/light theme with system detection | ✅ |
| URL slugs for SEO-friendly navigation | ✅ |
| Desktop header + mobile bottom nav | ✅ |
| Keyboard shortcuts | ✅ |
| Convex backend (schema, queries, mutations) | ✅ |
| Anonymous auth (view-only) | ✅ |
| Email/password auth | ✅ |
| Add Song/Arrangement forms with auth gating | ✅ |
| Setlists wired to Convex | ✅ |
| Seed script for initial data | ✅ |

---

## Phase 5.5: User Display & Profile Basics

**Goal**: Show who created arrangements and provide basic profile visibility.

#### Tasks

- [x] **Add username/display name to users**
  - Add `displayName` field to user schema (optional, derived from OAuth or email)
  - Update `convex/users.ts` with update mutation

- [x] **Profile picture storage (Cloudflare R2)**
  - Installed `@convex-dev/r2` component
  - Created `convex/files.ts` with upload/save/delete mutations
  - Created `ProfilePictureUpload` component with drag-drop support
  - Created `UserAvatar` component with initials fallback
  - **Note**: Requires R2 bucket setup and env vars (see setup instructions below)

- [ ] **Show creator on arrangements**
  - Add creator info to arrangement cards on song page
  - Add creator info to arrangement detail view
  - Query pattern: join arrangements with users

- [ ] **Basic user profile page**
  - Route: `/user/:userId` or `/user/:username`
  - Display: username, join date, arrangement count
  - List: user's public arrangements

- [ ] **Update AuthProvider**
  - Include displayName in User type
  - Handle OAuth profile data (name, picture)

#### R2 Setup Instructions

1. Create Cloudflare R2 bucket: `hsasongbook-files`
2. Create API token with R2 read/write permissions
3. Configure CORS on bucket for `*.convex.cloud` and `localhost:*`
4. Set environment variables:
   ```bash
   npx convex env set R2_ENDPOINT https://<ACCOUNT_ID>.r2.cloudflarestorage.com
   npx convex env set R2_ACCESS_KEY_ID <your-access-key>
   npx convex env set R2_SECRET_ACCESS_KEY <your-secret-key>
   npx convex env set R2_BUCKET hsasongbook-files
   ```

#### Schema Changes

```typescript
// convex/schema.ts - users table (overriding auth tables)
users: defineTable({
  // Auth fields (from @convex-dev/auth)
  name: v.optional(v.string()),
  image: v.optional(v.string()),
  email: v.optional(v.string()),
  emailVerificationTime: v.optional(v.number()),
  phone: v.optional(v.string()),
  phoneVerificationTime: v.optional(v.number()),
  isAnonymous: v.optional(v.boolean()),
  // Custom fields
  displayName: v.optional(v.string()),
  avatarKey: v.optional(v.string()),  // R2 object key
}).index("email", ["email"])
  .index("by_displayName", ["displayName"])
```

---

## Success Criteria for Phase 5.5

### Must Have (MVP)
- [ ] Arrangements show creator name
- [ ] Basic profile page exists

### Nice to Have
- [x] Profile picture upload
- [ ] Edit display name

---

## Architecture Overview

### Current State (Phase 5.4 Complete)
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
- **Creating/Editing**: Requires internet connection (MVP)
- **Future**: "Download for Offline" feature for setlists (see POST_MVP_ROADMAP.md)

---

## Data Model

### Ownership & Access Rules
| Entity | Read Access | Write Access |
|--------|-------------|--------------|
| **Songs** | Everyone (including anonymous) | Authenticated users only |
| **Arrangements** | Everyone | Creator only |
| **Setlists** | Creator only | Creator only |

---

## Key Files

| Purpose | Path |
|---------|------|
| Main App | `src/app/App.tsx` |
| Auth Provider | `src/features/auth/context/AuthProvider.tsx` |
| Auth Forms | `src/features/auth/components/SignInForm.tsx` |
| Convex Schema | `convex/schema.ts` |
| Convex Auth | `convex/auth.ts` |
| Convex Auth Config | `convex/auth.config.ts` |
| Convex Songs API | `convex/songs.ts` |
| Convex Arrangements API | `convex/arrangements.ts` |
| Convex Setlists API | `convex/setlists.ts` |
| Convex Files API (R2) | `convex/files.ts` |
| Convex R2 Config | `convex/convex.config.ts` |
| Convex Seed Script | `convex/seed.ts` |
| User Types | `src/types/User.types.ts` |
| Profile Picture Upload | `src/features/auth/components/ProfilePictureUpload.tsx` |
| User Avatar Component | `src/components/UserAvatar.tsx` |

---

## How to Seed the Database

```bash
npx convex run seed:seedDatabase   # Populate with initial data
npx convex run seed:clearDatabase  # Clear all data (for testing)
```

---

## Post-MVP Features

See [POST_MVP_ROADMAP.md](POST_MVP_ROADMAP.md) for:
- OAuth authentication (Google, Apple)
- Bug fixes
- Permissions & ownership features
- User & social features
- Setlist enhancements
- Editor UX improvements
- Search improvements
- Technical debt

---

## Document History

| Date | Change |
|------|--------|
| 2026-01-22 | **R2 file storage integration**: Added Cloudflare R2 for profile pictures via @convex-dev/r2 |
| 2026-01-22 | **Deferred OAuth to post-MVP**: Moved Google/Apple OAuth details to POST_MVP_ROADMAP.md |
| 2026-01-22 | **Phase 5.5 planning**: Detailed OAuth + user profile roadmap |
| 2026-01-22 | Extracted post-MVP features to POST_MVP_ROADMAP.md |
| 2026-01-22 | **Phase 5.4 complete**: Setlist management migrated to Convex |
| 2026-01-21 | **Phase 5.3 complete**: Add Song/Arrangement forms |
| 2026-01-21 | **Phase 5.2 complete**: Frontend uses Convex for all data |
| 2026-01-21 | Phase 5.1 complete: Convex schema + queries + mutations |
| 2025-01 | Pivoted from Supabase to Convex |
