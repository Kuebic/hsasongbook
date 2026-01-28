# HSA Songbook - Project Status & MVP Roadmap

**Last Updated**: 2026-01-28
**Current Phase**: MVP Complete + Post-MVP Enhancements
**Status**: Production-ready with ongoing feature development

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

### All MVP Phases ✅ COMPLETE

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
| Public setlists with sharing | ✅ |
| Setlist favorites system | ✅ |
| Performance mode with swipe nav | ✅ |
| Seed script for initial data | ✅ |
| User profiles with avatars | ✅ |
| Groups & permissions system | ✅ |
| Version history for Community content | ✅ |
| Collaborators on arrangements | ✅ |
| Favorites system | ✅ |
| Theme-based song discovery | ✅ |
| Song origin categorization | ✅ |
| Earth-tone color palette | ✅ |
| Audio/media attachments (MP3 + YouTube) | ✅ |
| Global audio player with mini-player | ✅ |
| Full theme customization system | ✅ |
| Font customization (app-wide + chord-specific) | ✅ |
| Discovery-oriented homepage | ✅ |
| Recently viewed tracking | ✅ |
| Custom keys per setlist entry | ✅ |
| Accordion-style settings page | ✅ |

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

- [x] **Show creator on arrangements**
  - Added `getBySongWithCreators` query to join arrangements with creator data
  - Updated `ArrangementCard` to display creator name with link to profile
  - Updated `ArrangementHeader` to display "Arranged by [name]" with link to profile
  - Respects user's `showRealName` preference (shows displayName or @username)

- [x] **Basic user profile page**
  - Route: `/user/:username`
  - Displays: avatar, username/display name, member since date, arrangement count
  - Lists: user's public arrangements in a grid
  - Added `getByUsername` query in `convex/users.ts`
  - Added `getByCreator` query in `convex/arrangements.ts`

- [x] **Update AuthProvider**
  - AuthProvider already correctly maps displayName from Convex user data
  - User type in `User.types.ts` already includes displayName, showRealName, username

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
- [x] Arrangements show creator name
- [x] Basic profile page exists

### Nice to Have
- [x] Profile picture upload
- [x] Edit display name (available in Settings > Account)

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
| **Songs** | Everyone (including anonymous) | Owner (user or group admins) |
| **Arrangements** | Everyone | Owner or collaborators |
| **Setlists** | Creator only | Creator only |
| **Groups** | Everyone (public groups) | Admins and owners |

### Content Ownership Model
- Songs and arrangements have an `ownerType` (`user` or `group`) and `ownerId`
- User-owned content: Only the creator can edit
- Group-owned content: Group admins/owners can edit; moderators can rollback Community content
- Community group: Special system group for shared/public content with version history

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
| Convex Groups API | `convex/groups.ts` |
| Convex Versions API | `convex/versions.ts` |
| Convex Permissions | `convex/permissions.ts` |
| Convex Files API (R2) | `convex/files.ts` |
| Convex R2 Config | `convex/convex.config.ts` |
| Convex Seed Script | `convex/seed.ts` |
| User Types | `src/types/User.types.ts` |
| Profile Picture Upload | `src/features/auth/components/ProfilePictureUpload.tsx` |
| User Avatar Component | `src/components/UserAvatar.tsx` |
| User Profile Page | `src/features/profile/pages/UserProfilePage.tsx` |
| Groups Feature | `src/features/groups/` |
| Version History Feature | `src/features/versions/` |
| Owner Selector | `src/features/shared/components/OwnerSelector.tsx` |
| Co-Author Picker | `src/features/shared/components/CoAuthorPicker.tsx` |
| Audio Player Context | `src/features/audio/context/AudioPlayerContext.tsx` |
| Global Audio Player | `src/features/audio/components/GlobalAudioPlayer.tsx` |
| Audio Upload Component | `src/features/audio/components/AudioUpload.tsx` |
| YouTube Input Component | `src/features/audio/components/YouTubeInput.tsx` |
| Audio References Form | `src/features/audio/components/AudioReferencesForm.tsx` |
| Appearance Provider | `src/features/appearance/context/UserAppearanceProvider.tsx` |
| Appearance Settings | `src/features/appearance/components/AppearanceSettings.tsx` |
| Theme Preset Picker | `src/features/appearance/components/ThemePresetPicker.tsx` |
| Color Palette Picker | `src/features/appearance/components/ColorPalettePicker.tsx` |
| Font Selector | `src/features/appearance/components/FontSelector.tsx` |
| Chord Style Settings | `src/features/appearance/components/ChordStyleSettings.tsx` |
| Color Presets | `src/features/appearance/presets/colorPresets.ts` |
| Font Presets | `src/features/appearance/presets/fontPresets.ts` |
| Settings Accordion | `src/features/settings/components/SettingsAccordion.tsx` |
| Recently Viewed Section | `src/features/search/components/RecentlyViewedSection.tsx` |
| Browse by Theme | `src/features/search/components/BrowseByTheme.tsx` |
| Browse by Origin | `src/features/search/components/BrowseByOrigin.tsx` |
| Browse by Style | `src/features/search/components/BrowseByStyle.tsx` |
| Compact Arrangement Card | `src/features/search/components/CompactArrangementCard.tsx` |
| Horizontal Scroll Section | `src/features/search/components/HorizontalScrollSection.tsx` |
| Add to Setlist Dialog | `src/features/setlists/components/AddToSetlistDialog.tsx` |
| Setlist Browse Page | `src/features/setlists/pages/SetlistsBrowsePage.tsx` |
| Setlist Performance Page | `src/features/setlists/pages/SetlistPerformancePage.tsx` |
| Performance Layout | `src/features/setlists/components/PerformanceLayout.tsx` |
| Setlist Privacy Selector | `src/features/setlists/components/SetlistPrivacySelector.tsx` |
| Setlist Favorite Button | `src/features/setlists/components/SetlistFavoriteButton.tsx` |
| Setlist Attribution | `src/features/setlists/components/SetlistAttribution.tsx` |
| Convex User Appearance API | `convex/userAppearancePreferences.ts` |
| Convex User Views API | `convex/userViews.ts` |

---

## How to Seed the Database

```bash
npx convex run seed:seedDatabase   # Populate with initial data
npx convex run seed:clearDatabase  # Clear all data (for testing)
```

---

## Phase 6: Groups & Permissions (NEW)

**Goal**: Implement comprehensive permissions and groups system per PRD_GROUPS_PERMISSIONS.md

### Phase 6.1: Collaborators ✅ COMPLETE
- [x] Add `arrangementCollaborators` table to schema
- [x] Create `convex/permissions.ts` with `canEditArrangement`, `isArrangementOwner`, `isArrangementCollaborator`
- [x] Add collaborator queries/mutations to `convex/arrangements.ts`
- [x] Update arrangement `update` mutation to use permission check
- [x] Create `useArrangementPermissions` hook
- [x] Update `ArrangementPage.tsx` to gate editing based on permissions
- [x] Create `CollaboratorsDialog.tsx` and `CollaboratorsList.tsx`

### Phase 6.2: Groups with Ownership ✅ COMPLETE
- [x] Add groups tables to schema (`groups`, `groupMembers`, `groupJoinRequests`, `arrangementAuthors`, `contentVersions`)
- [x] Add ownership fields to songs/arrangements (`ownerType`, `ownerId`)
- [x] Create migration functions in `convex/seed.ts` (`migrateOwnership`, `seedPublicGroup`)
- [x] Create `convex/groups.ts` API with full CRUD and membership management
- [x] Create `convex/versions.ts` for version history (Public group content)
- [x] Update `convex/permissions.ts` with group ownership logic
- [x] Create groups feature module (`src/features/groups/`)
  - Pages: `GroupsIndexPage`, `GroupPage`, `GroupSettingsPage`
  - Components: `GroupCard`, `GroupHeader`, `GroupJoinButton`, `GroupMemberList`, `JoinRequestList`, `CreateGroupDialog`, `GroupSettingsForm`
  - Hooks: `useGroupData`, `useGroupMembership`, `useGroupPermissions`
  - Validation: `groupSchemas.ts`
- [x] Update `ArrangementCard.tsx` for group ownership display
- [x] Add routes for groups pages (`/groups`, `/groups/:slug`, `/groups/:slug/settings`)

### Phase 6.2b: Version History ✅ COMPLETE
- [x] Create version history UI components (`src/features/versions/`)
  - `VersionHistoryPanel.tsx` - Collapsible panel showing version list
  - `VersionHistoryList.tsx`, `VersionItem.tsx` - List and item components
  - `RollbackConfirmDialog.tsx` - Confirmation dialog for rollbacks
  - `useVersionHistory.ts` hook - Query and manage versions
  - `useIsCommunityGroupModerator.ts` hook - Access control for moderators
- [x] Hook version creation into save flow for Community content
  - `maybeCreateVersionSnapshot()` helper in `convex/versions.ts`
  - Automatic snapshots on song/arrangement updates
- [x] Add version history panel to ArrangementPage for Community-owned content
- [x] Add version history panel to SongPage for Community-owned content
- [x] Add owner selector to song/arrangement create forms ("Post as myself" or "Post as [group]")
  - `src/features/shared/components/OwnerSelector.tsx`
  - Integrated into `AddSongForm.tsx` and `AddArrangementForm.tsx`
- [x] Add co-author picker for group posts
  - `src/features/shared/components/CoAuthorPicker.tsx`
  - Shows when group ownership is selected in arrangement forms
- [x] Update SongPage for group ownership display
  - `SongMetadata.tsx` - Shows owner info (Community vs other groups)
  - `SongOwnershipActions.tsx` - UI to transfer songs to/from Community

### Deployment Tasks (Run when ready)
```bash
npx convex run seed:migrateOwnership       # Add ownership fields to existing data
npx convex run seed:seedCommunityGroup     # Create Community system group
npx convex run seed:makeCommunityGroupOpen # Make Community open to join
```

---

## Phase 7: Audio & Media Features ✅ COMPLETE

**Goal**: Allow users to attach audio/video references to arrangements for learning and reference.

### Phase 7.1: Audio Infrastructure ✅ COMPLETE
- [x] **MP3 Upload Support**
  - R2 storage for MP3 files (10 MB max)
  - `audioFileKey` field on arrangements
  - `AudioUpload.tsx` component with drag-drop
  - Automatic cleanup on arrangement deletion

- [x] **YouTube Video Integration**
  - `youtubeUrl` field on arrangements
  - `YouTubeInput.tsx` component with URL validation
  - Thumbnail preview extraction
  - YouTube iframe embed with Picture-in-Picture support

- [x] **Global Audio Player**
  - `GlobalAudioPlayer.tsx` - Persistent floating player
  - Three states: Hidden, Collapsed (mini bar), Expanded (full controls)
  - Survives navigation across routes
  - Controls: Play/pause, seek slider, volume, mute toggle
  - Source toggle (MP3 vs YouTube when both available)
  - Audio context management via `AudioPlayerContext`

- [x] **Audio Management UI**
  - `AudioReferencesForm.tsx` - Combined form for managing both audio types
  - Edit mode toggle for arrangement owners
  - Delete confirmations with automatic file cleanup
  - Integration with arrangement edit workflow

**Database Schema Changes:**
```typescript
arrangements: {
  audioFileKey: v.optional(v.string()),  // R2 object key for MP3
  youtubeUrl: v.optional(v.string()),    // YouTube video URL
}
```

---

## Phase 8: Theme & Appearance Customization ✅ COMPLETE

**Goal**: Provide comprehensive theme and display customization to users for personalized reading experience.

### Phase 8.1: Color Theme System ✅ COMPLETE
- [x] **Preset Color Themes**
  - Five curated themes: Earth-tones (default), Ocean, Forest, Sunset, Classic
  - Light/dark mode adaptive color palettes
  - Primary and accent color combinations
  - `colorPresets.ts` - Theme definitions with 20+ colors

- [x] **Custom Color Selection**
  - User can mix-and-match primary + accent colors
  - `ColorPalettePicker.tsx` - Visual color selection UI
  - `ThemePresetPicker.tsx` - Quick preset selection
  - Real-time preview of color changes

- [x] **Theme Application**
  - CSS custom properties applied at app root
  - Preferences stored in `userAppearancePreferences` table
  - Cross-device sync via Convex
  - `UserAppearanceProvider.tsx` - Theme state management

### Phase 8.2: Font Customization ✅ COMPLETE
- [x] **App-Wide Font Selection**
  - Font family options: System, Inter, Lora, etc.
  - Global font size scaling (0.85x - 1.25x)
  - `FontSelector.tsx` - Font and size controls
  - `fontPresets.ts` - Font definitions

- [x] **Chord-Specific Styling**
  - Chord font family override (inherit, monospace)
  - Chord font size scaling (0.8x - 1.4x)
  - Chord font weight (normal, medium, bold)
  - Custom chord color selection from palette
  - Chord highlight toggle (background highlight)
  - `ChordStyleSettings.tsx` - Chord styling controls

- [x] **Settings Integration**
  - Accordion-style settings layout (`SettingsAccordion.tsx`)
  - Appearance section with all customization options
  - Live preview panel showing chord styling changes
  - `AppearanceSettings.tsx` - Main appearance settings component

**Database Schema Changes:**
```typescript
userAppearancePreferences: defineTable({
  userId: v.id("users"),
  colorPreset: v.optional(v.string()),          // "earth-tones", "ocean", etc.
  primaryColorId: v.optional(v.string()),       // Custom primary color
  accentColorId: v.optional(v.string()),        // Custom accent color
  fontFamily: v.optional(v.string()),           // App-wide font
  fontSize: v.optional(v.number()),             // Scale multiplier
  chordFontFamily: v.optional(v.string()),      // Chord font
  chordFontSize: v.optional(v.number()),        // Chord size scale
  chordFontWeight: v.optional(v.string()),      // Chord weight
  chordColorId: v.optional(v.string()),         // Chord color
  chordHighlight: v.optional(v.boolean()),      // Chord highlighting
  updatedAt: v.number(),
}).index("by_user", ["userId"])
```

---

## Phase 9: Discovery-Oriented Homepage ✅ COMPLETE

**Goal**: Transform homepage into a content discovery platform with multiple browsing pathways.

### Phase 9.1: Homepage Redesign ✅ COMPLETE
- [x] **Hero Section**
  - Prominent search bar with instant results
  - Welcome message and value proposition
  - `SearchPage.tsx` - Redesigned with hero and sections

- [x] **Discovery Sections**
  - `RecentlyViewedSection.tsx` - Personal browsing history
  - `FavoritesSection.tsx` - Quick access to favorited arrangements
  - `BrowseByTheme.tsx` - Theme-based song discovery
  - `BrowseByOrigin.tsx` - Browse by song origin (Traditional Holy, Pioneer, etc.)
  - `BrowseByStyle.tsx` - Genre/style-based discovery
  - `RecentlyAddedSection.tsx` - Fresh content discovery
  - Popular songs section with sort by favorites
  - `SignInCTA.tsx` - Encourage sign-up for anonymous users

- [x] **User Views Tracking**
  - `userViews` table tracks recently viewed arrangements
  - `useArrangementData.ts` hook records view on page visit
  - Queries in `convex/userViews.ts` for recent activity

- [x] **Improved Browsing Components**
  - `CompactArrangementCard.tsx` - Horizontal card layout
  - `HorizontalScrollSection.tsx` - Scrollable section wrapper
  - `QuickAccessBar.tsx` - Quick action buttons

**Database Schema Changes:**
```typescript
userViews: defineTable({
  userId: v.id("users"),
  arrangementId: v.id("arrangements"),
  viewedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_and_arrangement", ["userId", "arrangementId"])
```

---

## Phase 10: Setlist Enhancements ✅ COMPLETE

**Goal**: Enhance setlist functionality for performance preparation and community sharing.

### Completed Features

#### Core Features (Phase 10.1)
- [x] **Custom Keys per Entry**
  - `customKey` field on individual setlist songs
  - Override arrangement key for specific performances
  - Schema update: setlist songs now have `{ arrangementId, customKey }` structure
  - UI controls for per-song key selection

- [x] **Add to Setlist Dialog**
  - `AddToSetlistDialog.tsx` - Searchable dialog for adding arrangements
  - Quick add from arrangement cards
  - Fuzzy search in setlist selector
  - `useSetlistSearch.ts` hook for search functionality

#### Public Setlists & Sharing (Phase 10.2) ✅ NEW
- [x] **Privacy Levels**
  - Private (default): Only owner can view
  - Unlisted: Shareable via link, not in browse
  - Public: Discoverable in browse/search
  - `SetlistPrivacySelector.tsx` and `SetlistPrivacyBadge.tsx` components

- [x] **Setlist Sharing**
  - Share setlists with specific users
  - View-only or edit permissions
  - `setlistShares` table for sharing relationships
  - "Shared with me" view in setlist index

- [x] **Browse Public Setlists**
  - `/setlists/browse` - Discover community setlists
  - Search by name, filter by tags
  - Sort by popular (favorites), recent, or name
  - Stats display (total setlists, songs, favorites)

- [x] **Setlist Favorites**
  - Heart/favorite public and unlisted setlists
  - Favorites count displayed on cards
  - `SetlistFavoriteButton.tsx` component
  - Anonymous favorites warning

- [x] **Setlist Duplication**
  - Duplicate any viewable setlist to your collection
  - Attribution tracking (`duplicatedFrom`, `duplicatedFromName`)
  - Toggle attribution visibility
  - `SetlistAttribution.tsx` component

- [x] **Performance Mode Improvements**
  - Fullscreen chord sheet display
  - Swipe navigation between songs
  - Keyboard navigation (arrow keys)
  - Progress indicator with song count
  - `PerformanceLayout.tsx`, `ProgressPill.tsx` components

**Schema Changes:**
```typescript
setlists: {
  songs: v.optional(v.array(v.object({
    arrangementId: v.id("arrangements"),
    customKey: v.optional(v.string()),
  }))),
  privacyLevel: v.optional(v.union(
    v.literal("private"),
    v.literal("unlisted"),
    v.literal("public")
  )),
  tags: v.optional(v.array(v.string())),
  estimatedDuration: v.optional(v.number()),
  difficulty: v.optional(v.union(...)),
  duplicatedFrom: v.optional(v.id("setlists")),
  duplicatedFromName: v.optional(v.string()),
  showAttribution: v.optional(v.boolean()),
  favorites: v.optional(v.number()),
  createdAt: v.optional(v.number()),
}
.index("by_privacy", ["privacyLevel"])

setlistShares: defineTable({
  setlistId: v.id("setlists"),
  userId: v.id("users"),
  canEdit: v.boolean(),
  addedBy: v.id("users"),
  addedAt: v.number(),
})
```

### Still TODO
- [ ] Notes per setlist entry (performance notes)
- [ ] Offline caching for performance mode

---

## Post-MVP Features

See [POST_MVP_ROADMAP.md](POST_MVP_ROADMAP.md) for:
- OAuth authentication (Google, Apple)
- Collaborator notifications
- User onboarding
- Editor improvements
- Comments system
- Setlist offline mode
- Technical debt

---

## Document History

| Date | Change |
|------|--------|
| 2026-01-28 | **Phase 10 complete**: Public setlists with privacy levels, sharing, favorites, browse page, duplication with attribution, improved performance mode with swipe navigation |
| 2026-01-28 | **Song enhancements**: Notes field with bible verses and quotes, ownership transfer to/from groups |
| 2026-01-27 | **Phase 10 partial**: Custom keys per setlist entry, add to setlist dialog with search |
| 2026-01-27 | **Phase 9 complete**: Discovery-oriented homepage with recently viewed, browse by theme/origin/style, hero section |
| 2026-01-27 | **Phase 8 complete**: Full theme customization system - color themes (5 presets + custom), font customization (app-wide + chord-specific), appearance settings with live preview |
| 2026-01-27 | **Phase 7 complete**: Audio/media features - MP3 uploads (10 MB max), YouTube video links, global audio player with mini-player, source toggle |
| 2026-01-26 | **Audio references feature development**: MP3 uploads (10 MB max) and YouTube links on arrangements with floating mini-player |
| 2026-01-26 | **Post-MVP enhancements**: Earth-tone color palette, theme suggestions, song origin field, favorites system, redesigned search page with browse-by-theme |
| 2026-01-23 | **Database optimizations**: Fixed N+1 in `groups.ts list()`, added `isSystemGroup` index, added `arrangements.getCountsBySong` query, fixed SongList over-fetching |
| 2026-01-23 | **Phase 6.2b complete**: Version history UI, owner selector in forms, co-author picker, song ownership display. Full groups & permissions system complete. |
| 2026-01-23 | **Phase 6.2 complete**: Groups feature with ownership, membership, permissions. Routes: `/groups`, `/groups/:slug`, `/groups/:slug/settings` |
| 2026-01-23 | **Phase 6.1 complete**: Collaborators system for arrangements with permissions checking |
| 2026-01-22 | **Phase 5.5 complete**: Creator display on arrangements, user profile page at `/user/:username` |
| 2026-01-22 | **R2 file storage integration**: Added Cloudflare R2 for profile pictures via @convex-dev/r2 |
| 2026-01-22 | **Deferred OAuth to post-MVP**: Moved Google/Apple OAuth details to POST_MVP_ROADMAP.md |
| 2026-01-22 | **Phase 5.5 planning**: Detailed OAuth + user profile roadmap |
| 2026-01-22 | Extracted post-MVP features to POST_MVP_ROADMAP.md |
| 2026-01-22 | **Phase 5.4 complete**: Setlist management migrated to Convex |
| 2026-01-21 | **Phase 5.3 complete**: Add Song/Arrangement forms |
| 2026-01-21 | **Phase 5.2 complete**: Frontend uses Convex for all data |
| 2026-01-21 | Phase 5.1 complete: Convex schema + queries + mutations |
| 2025-01 | Pivoted from Supabase to Convex |
