# HSA Songbook - Post-MVP Roadmap

**Last Updated**: 2026-01-30

Remaining features and improvements after MVP launch, organized by priority.

---

## Priority 1: Pre-Launch Fixes (Editor UX)

Issues blocking soft launch - must fix before sharing with users.

| Issue | Description | Effort |
|-------|-------------|--------|
| **Cursor jumping on highlight** | When bracket highlighting disappears, cursor position shifts 3-4 spaces. Happens on both mobile and desktop. Related to CodeMirror state sync. | Medium |
| **Debounce syntax errors** | Don't show "unclosed bracket" errors while user is mid-keystroke. Add ~500ms debounce before displaying parse errors. | Low |
| **Navigate to editor after create** | "Add Arrangement" dialog should open chord editor immediately, not the arrangement view page. | Low |
| **Copy ChordPro button** | Add "Copy to clipboard" for ChordPro content. Anyone can copy for Planning Center use (community spirit). | Low |

---

## Priority 2: Arrangement & Song Editing Gaps

Missing metadata fields and edit capabilities.

| Feature | Description | Effort |
|---------|-------------|--------|
| **Editable "Arranged By"** | User/group picker for arrangement attribution (like song ownership transfer). Currently no way to credit the arranger. | Medium |
| **Arrangement notes field** | Public notes field shown on arrangement page (e.g., "Source: tparents resource", "Based on Hillsong version"). | Low |
| **Edit tags after creation** | Tags, instrument, energy, style not editable post-creation. Add these to the arrangement edit dialog. | Medium |
| **Discoverable audio upload** | Audio/YouTube section not obvious in edit UI. Consider moving out of accordion or adding visual indicator. | Low |
| **BPM tapper** | Tap-to-set BPM button for convenience when setting tempo. | Low |
| **Link duplicated arrangements** | Show "Duplicated from [original]" attribution like setlists already do. Track `duplicatedFrom` field. | Low |
| **Artist autocomplete in edit** | Verify ArtistInput component works in SongEditForm (exists in AddSongForm). | Low |

---

## Priority 3: Search & Discovery

Enhancements to help users find content.

| Feature | Description | Effort |
|---------|-------------|--------|
| **Lyrics search** | Search by first few words of lyrics. Add lyrics to Fuse.js index (currently only title/artist/themes). | Medium |
| **Exclude themes filter** | Filter OUT certain themes, not just include. "Show everything except 'new-era'". | Medium |
| **Community songs filter** | Browse songs owned by Community group. Backend query exists, needs UI filter. | Low |
| **Theme: add "grace"** | Add to THEME_SUGGESTIONS in tagConstants.ts | Low |
| **Theme: add "providence"** | Add to THEME_SUGGESTIONS in tagConstants.ts | Low |
| **Theme: rename "new-age" to "new-era"** | Rename in constants AND migrate all existing songs with this theme. | Low |
| **Theme Enter behavior** | Pressing Enter should select the highlighted autocomplete suggestion, not add raw typed text. | Low |
| **Origin: Korean Christian Hymn** | Add new origin category for Korean hymns (separate from Traditional Holy Songs). | Low |

---

## Priority 4: User Experience Polish

Visual fixes, onboarding, and profile enhancements.

### Visual Issues

| Issue | Description | Effort |
|-------|-------------|--------|
| **Card text cutoff** | "Holy" shows with clipped "y" tail on search cards. Check line-height/overflow on card titles. | Low |
| **Song vs arrangement cards** | Make visual distinction clearer, especially on smaller screens. Different card styling or clear labels. | Medium |
| **Spiritual context collapse** | Spiritual notes should expand/collapse like lyrics section does. | Low |
| **Settings link from arrangement** | Add link to appearance settings from arrangement view for chord styling customization. | Low |

### User Profile

| Feature | Description | Effort |
|---------|-------------|--------|
| **Avatar click to upload** | Clicking own profile pic on profile page should open upload dialog (currently only in Settings). | Low |
| **Profile: bio field** | Add optional bio/about text to user profile. | Low |
| **Profile: church location** | Add optional church/location field. | Low |
| **Profile: social links** | Add optional social media links (Instagram, YouTube, etc.). | Medium |
| **Account deletion** | Delete account with options: delete all content, mark as "deleted user", or keep community-owned content. Warn about duplicates losing links. | High |
| **Ko-fi donations** | Add donations page/link somewhere accessible. | Low |

### Onboarding & Clarity

| Feature | Description | Effort |
|---------|-------------|--------|
| **First-time welcome modal** | Explain: community songbook (not private), all content public, community editing options, ChordPro format. | Medium |
| **Set community ownership at creation** | Option to assign song to Community group when adding (not just transfer later). | Low |
| **Clarify spiritual input** | Make it clearer that song owner can add spiritual notes, bible verses, quotes. | Low |
| **Collaborator notifications** | Users have no way of knowing when added as collaborator. | Medium |

---

## Priority 5: Future Features

Lower priority features for after launch stabilizes.

| Feature | Description | Effort |
|---------|-------------|--------|
| **Comments with threads** | Threaded comments on songs and arrangements. New `comments` table, soft-delete, denormalized counts. Design decision needed: Reddit-style nesting vs GitHub-style flat with replies. | High |
| **Google OAuth** | Social login via Google. Setup in Google Cloud Console, add provider to convex/auth.ts. | Medium |
| **Apple OAuth** | Only if planning App Store release. $99/year, no localhost testing, secrets expire every 6 months. | High |
| **Setlist notes per entry** | Add performance notes to individual songs within a setlist. | Low |
| **Offline performance mode** | "Save for Offline" button, store in IndexedDB, read when offline. Critical for mid-performance reliability. | High |

---

## Technical Debt

Code quality improvements - low priority, do when convenient.

| Issue | Fix | Effort |
|-------|-----|--------|
| **Duplicated type mappers** | Extract to `convex/mappers.ts` | Low |
| **Convex ID type casting** | Type IDs upstream to reduce casts | Medium |
| **No-op `reload()` functions** | Remove from hooks (Convex auto-syncs) | Low |
| **Stubbed `updateSongKey`** | Remove or throw error | Low |
| **Repeated creator joins** | Extract `attachCreatorInfo()` helper | Medium |
| **Deleted arrangements in setlists** | Show "arrangement deleted" placeholder; add option to remove | Low |
| **Form boilerplate** | Extract ~20 lines of useState/try-catch to `useFormHandler` hook | Medium |
| **Magic numbers** | Slug length (30) and nanoid length (6) should be constants | Low |
| **Possibly unused** | Verify if `chordsheetjs` dependency is actually used | Low |

### Low-Priority N+1 Patterns

These exist but Convex batches parallel `ctx.db.get()` calls internally:

| File | Pattern | Impact |
|------|---------|--------|
| `convex/arrangements.ts` | Fetching creator data per arrangement in `getBySongWithCreators` | Low - typically <10 arrangements per song |
| `convex/arrangements.ts` | Fetching collaborator + addedBy user data in loops | Low - few collaborators |
| `convex/versions.ts` | Fetching user data per version in history | Low - versions are paginated |

---

## Deferred Ideas

Not currently planned - revisit if user demand emerges.

### Multi-Language Support

Many songs have Korean origins with English translations. Would involve:
- Dual titles (Korean + English)
- Multiple lyrics per language
- CJK font support
- Cross-language search

**Decision**: Too complex for current user base. Users can add Korean titles in parentheses manually for now.

### Mashup Arrangements

Arrangements combining multiple songs, appearing under each parent song. Very niche use case.

### Lead Sheet / Sheet Music PDFs

PDF uploads for musicians. Low priority since most users need chord charts, not sheet music.

---

## Known Workarounds

### Auth State Issue

**Problem**: Sign-in form occasionally stays on "Authenticating..." requiring page refresh.

**Workaround**: `window.location.href = '/'` after sign-in.

**References**: [convex-backend#259](https://github.com/get-convex/convex-backend/issues/259), [convex-auth#92](https://github.com/get-convex/convex-auth/issues/92)

---

## Effort Guide

| Effort | Estimate | Examples |
|--------|----------|----------|
| **Low** | < 2 hours | Bug fixes, UI tweaks, adding fields |
| **Medium** | 2-8 hours | New components, simple features |
| **High** | 1-3 days | Complex features, architecture changes |
