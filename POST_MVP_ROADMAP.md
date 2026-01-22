# HSA Songbook - Post-MVP Roadmap

**Extracted from PROJECT_STATUS.md on 2026-01-22**

This document contains future features and improvements planned after MVP completion. These are not blocking release but represent valuable enhancements for future iterations.

---

## 🐛 Bugs

| Issue | Description |
|-------|-------------|
| **Fullscreen exit broken** | ESC exits browser fullscreen but not editor fullscreen mode; must click unfullscreen icon |

---

## 🔐 Permissions & Ownership

| Feature | Description |
|---------|-------------|
| **Restrict editing to owners** | Users should only edit their own arrangements; viewing others' should prompt "duplicate to edit" |
| **Edit song details** | Allow editing title, artist, themes, lyrics (at minimum by creator; consider crowdsourcing with moderation) |
| **Delete own arrangements** | Allow users to delete arrangements they created |
| **Duplicate arrangements** | Copy another user's arrangement as your own to customize |

---

## 🔑 OAuth Authentication

### Overview

Add social sign-in options for frictionless authentication. Google is simpler; Apple has significant constraints.

### Google OAuth

**Complexity**: Low-Medium

**Setup Steps**:
1. Create project in [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to Google Auth Platform overview → GET STARTED
3. Configure OAuth consent screen (app name, support email, External audience)
4. Create OAuth credentials:
   - Go to Credentials → Create Credentials → OAuth Client ID
   - Select "Web Application"
   - Add Authorized JavaScript Origins: `http://localhost:5173` (dev)
   - Add Authorized Redirect URI: `https://<your-deployment>.convex.site/api/auth/callback/google`
   - Find your HTTP Actions URL in Convex dashboard: Settings → URL & Deploy Key (ends in `.site`)

**Environment Variables** (set in Convex dashboard or CLI):
```bash
npx convex env set AUTH_GOOGLE_ID <your-client-id>
npx convex env set AUTH_GOOGLE_SECRET <your-client-secret>
```

**Code Changes** - Update `convex/auth.ts`:
```typescript
import Google from "@auth/core/providers/google";  // Note: default export
import { convexAuth } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Anonymous,
    Password({ verify: undefined }),
    Google,  // Reads AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET automatically
  ],
});
```

**Frontend Usage**:
```typescript
import { useAuthActions } from "@convex-dev/auth/react";

const { signIn } = useAuthActions();
await signIn("google");  // Redirects to Google OAuth
```

**Notes**:
- Need separate Google OAuth apps for dev vs production (different redirect URIs)
- Google will show your Convex site URL in consent screen (custom domain requires Convex Pro)

### Apple OAuth

**Complexity**: High

**Critical Constraints**:
- ⚠️ **Cannot test on localhost** - Requires deployment to public site with valid SSL
- ⚠️ **$99/year** Apple Developer Program membership required
- ⚠️ **Secret expires every 6 months** - AUTH_APPLE_SECRET is a JWT that must be regenerated

**Setup Steps**:
1. Join [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
2. Go to Certificates, Identifiers & Profiles
3. Create an **App ID**:
   - Select "App IDs" → click `+`
   - Fill in Description and Explicit Bundle ID
   - Enable "Sign in with Apple" checkbox
   - Complete registration
4. Create a **Services ID**:
   - Select "Services IDs" → click `+`
   - Fill in Description and Identifier
   - Register, then configure "Sign in with Apple"
   - Set Return URL: `https://<your-deployment>.convex.site/api/auth/callback/apple`
5. Generate a **Key**:
   - Go to Keys section → create new key
   - Enable "Sign in with Apple", select your App ID
   - Download the `.p8` file (store securely!)

**Environment Variables**:
```bash
npx convex env set AUTH_APPLE_ID <service-identifier>
npx convex env set AUTH_APPLE_SECRET <generated-jwt>
```

The secret JWT must be generated using:
- Team ID
- Key ID (from the `.p8` file)
- The private key content
- Service ID

Use the [Convex Auth JWT generator form](https://labs.convex.dev/auth/config/oauth/apple) to create this.

**Code Changes** - Update `convex/auth.ts`:
```typescript
import Apple from "@auth/core/providers/apple";

// Apple only shares user's name on FIRST authentication
// This profile handler preserves it for future logins
Apple({
  profile: (appleInfo) => ({
    id: appleInfo.sub,
    name: appleInfo.user?.name
      ? `${appleInfo.user.name.firstName} ${appleInfo.user.name.lastName}`
      : undefined,
    email: appleInfo.email,
  }),
}),
```

**Frontend Usage**:
```typescript
await signIn("apple");
```

**Recommendation**: Only implement if planning App Store release (required if offering other social sign-ins) or significant iOS user base.

### Account Linking Consideration

If a user signs up with email then later uses Google/Apple with the same email:
- **Recommended approach**: Same email = same account (auto-link)
- Convex Auth handles this via the `email` field in the users table

### References
- [Convex Auth - Google OAuth](https://labs.convex.dev/auth/config/oauth/google)
- [Convex Auth - Apple OAuth](https://labs.convex.dev/auth/config/oauth/apple)
- [Convex Auth - OAuth Overview](https://labs.convex.dev/auth/config/oauth)

---

## 👤 User & Social Features

| Feature | Description |
|---------|-------------|
| **Show arrangement creator** | Display username on arrangements |
| **User profile pages** | View user's created arrangements |
| **Filter by "my arrangements"** | On song page, filter to show only your arrangements |
| **Ratings & favorites UI** | Like/rate arrangements, especially from within arrangement view |

---

## 🎹 Setlist Enhancements

| Feature | Description |
|---------|-------------|
| **Offline setlist caching** | "Download for Offline" for performance mode (see Architecture Notes below) |
| **Custom key per setlist entry** | Override arrangement key for specific setlist songs |
| **Notes per setlist entry** | Add performance notes to individual setlist songs |

---

## ✏️ Editor UX Improvements

| Feature | Description |
|---------|-------------|
| **Debounce error alerts** | Don't show syntax errors mid-typing (e.g., unclosed `[]`) |
| **Clarify save/undo buttons** | Document or fix save button behavior (auto-save?); verify undo/redo works |
| **Better navigation from editor** | Add direct "back to arrangement" link instead of going through song page |
| **Remove arrangement switcher** | Remove bottom-corner arrangement nav in editor; use song page instead |

---

## 🔍 Search & Input Improvements

| Feature | Description |
|---------|-------------|
| **Song title autocomplete** | When adding song, suggest existing titles to prevent duplicates |
| **Tag chips with autocomplete** | Replace comma-separated text with chip UI; enforce lowercase, hyphens instead of spaces |
| **Server-side search** | Move search filtering to Convex query for scale |

---

## 🎵 Key Selection UX

| Feature | Description |
|---------|-------------|
| **Fix key dropdown overflow** | "All keys" section gets cut off |
| **Better enharmonic handling** | Show both sharp/flat variants (C#/Db) or use Planning Center-style picker |

---

## 🔧 Technical Debt

| Issue | Fix |
|-------|-----|
| **N+1 query in SongList** | Add `arrangements.countBySong` query instead of fetching all arrangements |
| **Duplicated type mappers** | Extract `mapConvexArrangement`/`mapConvexSong` to shared `convex/mappers.ts` |
| **Convex ID type casting** | Reduce `as Id<'setlists'>` casts by typing IDs upstream |
| **No-op `reload()` functions** | Remove from `useSetlistData`/`useSetlists` (Convex auto-syncs) |
| **Stubbed `updateSongKey`** | Remove from interface or throw error instead of logging warning |

---

## Architecture Notes: Offline Performance Mode

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
