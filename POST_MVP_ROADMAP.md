# HSA Songbook - Post-MVP Roadmap

**Last Updated**: 2026-01-23

Features and improvements planned after MVP, organized by priority and effort.

---

## Priority 1: Critical Bugs

Issues significantly impacting user experience.

| Issue | Description | Effort | Status |
|-------|-------------|--------|--------|
| ~~**Mobile preview pane broken**~~ | ~~Preview pane doesn't work when editing chords on mobile~~ | ~~Medium~~ | ✅ Fixed |
| ~~**Fullscreen exit broken**~~ | ~~ESC exits browser fullscreen but not editor fullscreen mode~~ | ~~Low~~ | ✅ Fixed |
| ~~**Avatar not loading**~~ | ~~"Added by (username)" shows default avatar, not user's actual avatar~~ | ~~Low~~ | ✅ Fixed |
| ~~**Duplicate UI elements**~~ | ~~"Available Arrangements" shows twice; song title appears twice on arrangement view~~ | ~~Low~~ | ✅ Fixed |
| ~~**Printing broken**~~ | ~~Print functionality needs fixing~~ | ~~Medium~~ | ✅ Fixed |

### Auth State Issue (Workaround Applied)

**Problem**: Sign-in form stays on "Authenticating..." requiring page refresh.

**Workaround**: `window.location.href = '/'` after sign-in (navigates instead of reload to avoid service worker issues).

**References**: [GitHub #259](https://github.com/get-convex/convex-backend/issues/259), [GitHub #92](https://github.com/get-convex/convex-auth/issues/92)

### PWA SPA Route Refresh Issue (Fixed)

**Problem**: Refreshing on sub-routes (`/profile`, `/groups`, etc.) showed "you're offline" page in production.

**Root Cause**: Service worker `navigateFallback` was set to `/offline.html`. For SPAs, client-side routes aren't cached individually—they need to fall back to `index.html` so React Router can handle routing.

**Fix**: Changed `navigateFallback: '/offline.html'` → `navigateFallback: '/index.html'` in `vite.config.ts`. The app handles offline state via `useOnlineStatus` hook instead.

**References**: [vite-pwa docs](https://vite-pwa-org.netlify.app/guide/development), [GitHub #653](https://github.com/vite-pwa/vite-plugin-pwa/issues/653)

---

## Priority 2: Core Missing Features

Features users will expect that aren't blocking MVP.

### Content Management

| Feature | Description | Effort | Status |
|---------|-------------|--------|--------|
| ~~**Edit arrangement name**~~ | ~~Owner should be able to rename (URL uses ID, won't break)~~ | ~~Low~~ | ✅ Done |
| ~~**Delete own arrangements**~~ | ~~Allow users to delete their arrangements~~ | ~~Low~~ | ✅ Done |
| ~~**Duplicate arrangements**~~ | ~~Copy another user's arrangement to customize~~ | ~~Medium~~ | ✅ Done |
| **Edit song details** | Edit title, artist, themes, lyrics (by creator or community) | Medium |

### Navigation & Discovery

| Feature | Description | Effort | Status |
|---------|-------------|--------|--------|
| **Browse songs on homepage** | Currently only arrangements; need song browsing with filters | Medium | |
| ~~**Remove arrangement switcher**~~ | ~~Top-right dropdown and bottom quick-nav buttons removed~~ | ~~Low~~ | ✅ Done |
| ~~**Filter by "my arrangements"**~~ | ~~On song page, "Only mine" toggle filters to your arrangements~~ | ~~Low~~ | ✅ Done |
| ~~**"My Arrangements" on profile**~~ | ~~Profile page now shows arrangements you created or collaborate on~~ | ~~Low~~ | ✅ Done |

### Collaborator Awareness

| Feature | Description | Effort | Status |
|---------|-------------|--------|--------|
| **Collaborator notifications** | Users have no way of knowing when added as collaborator | Medium | |

---

## Priority 3: User Onboarding

### First-Time User Welcome

New users don't understand the community nature of the app.

**Solution**: Welcome modal explaining:
- This is a community songbook, not private
- All songs/arrangements are public
- Options to allow community editing
- How to join "Community" group for collaborative editing
- Also mention about ChordPro and how it's useful when appropriate

**Effort**: Medium

---

## Priority 4: Editor Improvements

| Feature | Description | Effort |
|---------|-------------|--------|
| **Debounce error alerts** | Don't show syntax errors mid-typing (e.g., unclosed `[]`) | Low |
| **Clarify save/undo buttons** | Improve save button behavior; verify undo/redo works | Low |
| **Chord progression parsing** | Recognize `[D / / / \| A/C# / / / |]` as transposable chords | High |
| **Formatting customization** | Add formatting customization abilities | Medium |

---

## Priority 5: Key Selection UX

| Issue | Fix | Effort |
|-------|-----|--------|
| **Key dropdown overflow** | "All keys" section gets cut off | Low |
| **Enharmonic handling** | Show both sharp/flat variants (C#/Db) or Planning Center-style picker | Medium |

---

## Priority 6: Search & Input

| Feature | Description | Effort |
|---------|-------------|--------|
| **Song title autocomplete** | Suggest existing titles when adding songs | Medium |
| **Tag chips with autocomplete** | Replace comma text with chip UI; enforce lowercase, hyphens | Medium |
| **Server-side search** | Move filtering to Convex for scale | Medium |

---

## Priority 7: User & Social Features

| Feature | Description | Effort |
|---------|-------------|--------|
| **Ratings & favorites** | Like/rate arrangements from arrangement view. Should also list # of raters | Medium |

---

## Priority 8: OAuth Authentication

### Google OAuth (Recommended First)

**Effort**: Low-Medium

**Setup**:
1. Create project in [Google Cloud Console](https://console.cloud.google.com/)
2. Configure OAuth consent screen
3. Create credentials with redirect: `https://<deployment>.convex.site/api/auth/callback/google`

```bash
npx convex env set AUTH_GOOGLE_ID <client-id>
npx convex env set AUTH_GOOGLE_SECRET <client-secret>
```

**Code** (`convex/auth.ts`):
```typescript
import Google from "@auth/core/providers/google";
// Add Google to providers array
```

**Frontend**: `await signIn("google")`

### Apple OAuth (Optional)

**Effort**: High | **Cost**: $99/year | **Constraints**: No localhost testing, secret expires every 6 months

Only implement if planning App Store release or significant iOS user base.

**References**: [Convex Auth - OAuth](https://labs.convex.dev/auth/config/oauth)

---

## Priority 9: Setlist Enhancements

| Feature | Description | Effort |
|---------|-------------|--------|
| **Custom key per entry** | Override arrangement key for specific songs | Medium |
| **Notes per entry** | Add performance notes to individual songs | Low |
| **Offline caching** | "Download for Offline" for performance mode | High |

### Offline Performance Mode Architecture

**Problem**: Convex queries fail offline. Unacceptable mid-performance.

**Solution**:
1. "Save for Offline" button on setlist page
2. Store in IndexedDB (`offlineSetlists`)
3. Read from IndexedDB when offline
4. Show "Available Offline" badge

**Rules**: Convex = source of truth, no offline editing, staleness indicator.

**Existing code**: `src/features/pwa/db/database.ts`, `useOnlineStatus.ts`, `setlists.ts:getWithArrangements`

---

## Priority 10: Technical Debt

| Issue | Fix | Effort | Status |
|-------|-----|--------|--------|
| ~~**N+1 query in SongList**~~ | ~~Add `arrangements.getCountsBySong` query~~ | ~~Low~~ | ✅ Done |
| ~~**N+1 queries in groups.ts list()**~~ | ~~Batch membership & member count queries~~ | ~~Medium~~ | ✅ Done |
| ~~**Full table scan for Community group**~~ | ~~Add `isSystemGroup` index, use `.first()`~~ | ~~Low~~ | ✅ Done |
| **Browse queries fetch all data** | `listWithArrangementSummary` and `getPopular` in `convex/songs.ts` fetch all songs/arrangements into memory then filter. Add pagination, indexes, or denormalize arrangement counts. | High | |
| **Duplicated type mappers** | Extract to `convex/mappers.ts` | Low | |
| **Convex ID type casting** | Type IDs upstream to reduce casts | Medium | |
| **No-op `reload()` functions** | Remove from hooks (Convex auto-syncs) | Low | |
| **Stubbed `updateSongKey`** | Remove or throw error | Low | |
| **Repeated creator joins** | Extract `attachCreatorInfo()` helper | Medium | |
| **Deleted arrangements in setlists** | Show "arrangement deleted" placeholder; add option to remove from setlist | Low | |

---

## Effort Guide

| Effort | Estimate | Examples |
|--------|----------|----------|
| **Low** | < 2 hours | Bug fixes, UI tweaks, dead code removal |
| **Medium** | 2-8 hours | New components, simple features |
| **High** | 1-3 days | Complex features, architecture changes |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-24 | Removed arrangement switchers (dropdown + bottom nav); added "Only mine" filter on song pages; added "My Arrangements" section to profile page |
| 2026-01-24 | Added arrangement management features: inline name editing, delete (with setlist warning), duplicate |
| 2026-01-23 | Fixed duplicate "Available Arrangements" header - removed from ArrangementList since SongPage already provides section header |
| 2026-01-23 | Fixed avatar not loading - SongMetadata now uses UserAvatar component; also fixed username @ prefix consistency (songs now show @username like arrangements) |
| 2026-01-23 | Fixed fullscreen exit - removed browser Fullscreen API, now uses CSS-only fullscreen so ESC works as expected |
| 2026-01-23 | Fixed mobile preview pane blank issue - replaced translateX sliding with conditional rendering in ChordProSplitView |
| 2026-01-23 | Fixed N+1 queries in groups.ts, added `getCountsBySong` query, added `isSystemGroup` index |
| 2026-01-23 | Reorganized by priority; consolidated scattered notes; added effort estimates |
| 2026-01-22 | Initial extraction from PROJECT_STATUS.md |

---

## Remaining Database Optimization Notes

### Still TODO (Lower Priority)

These N+1 patterns exist but are less critical (Convex batches parallel `ctx.db.get()` calls internally):

| File | Pattern | Impact |
|------|---------|--------|
| `convex/arrangements.ts` | Fetching creator data per arrangement in `getBySongWithCreators` | Low - typically <10 arrangements per song |
| `convex/arrangements.ts` | Fetching collaborator + addedBy user data in loops | Low - few collaborators |
| `convex/versions.ts` | Fetching user data per version in history | Low - versions are paginated |

### Code Quality Notes

- **Form boilerplate duplication**: Each form repeats ~20 lines of useState/try-catch/error handling. Could extract to a `useFormHandler` hook.
- **Magic numbers**: Slug length (30) and nanoid length (6) should be constants
- **Possibly unused**: `chordsheetjs` dependency - verify if actually used

---
# random notes to be added if not already
- Admin UI for featured songs management
- Guitar vs Piano filter (needs instrument field or tag convention)
- Language filter (Korean/Japanese support)
- Scripture reference field and filter