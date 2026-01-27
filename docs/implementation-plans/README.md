# Implementation Plans: Setlist Privacy, Sharing & Discovery

This directory contains the complete implementation plan for expanding setlists from private-only to full sharing and discovery features.

## Overview

This feature adds:
- ✅ Privacy levels (private, unlisted, public)
- ✅ Explicit user sharing with edit/view permissions
- ✅ Public setlist discovery and browsing
- ✅ Setlist duplication with attribution
- ✅ Favorites system integration
- ✅ Anonymous user support
- ✅ Offline caching for PWA
- ✅ User profile integration

## How to Use These Plans

### Option 1: Full Plan
Read [00-FULL-PLAN.md](./00-FULL-PLAN.md) for the complete implementation strategy in one document.

### Option 2: Phased Implementation (Recommended)
Implement one phase at a time for better focus and easier context management:

1. **[Phase 1: Backend Foundation](./setlist-sharing-PHASE-1-backend-foundation.md)**
   - Update Convex schema with privacy fields
   - Add permission functions
   - Create data migration
   - **Estimate:** 2-3 hours

2. **[Phase 2: Core Sharing Mutations](./setlist-sharing-PHASE-2-sharing-mutations.md)**
   - Add sharing mutations
   - Update existing queries
   - Add sharing info query
   - **Estimate:** 2-3 hours

3. **[Phase 3: Browse & Discovery](./setlist-sharing-PHASE-3-browse-discovery.md)**
   - Add browse query with filters
   - Add creator queries for profiles
   - Add metadata mutations
   - **Estimate:** 2-3 hours

4. **[Phase 4: Duplication & Favorites](./setlist-sharing-PHASE-4-duplication-favorites.md)**
   - Add duplicate mutation
   - Extend favorites schema
   - Update favorites toggle
   - **Estimate:** 2-3 hours

5. **[Phase 5: Frontend Types & Components](./setlist-sharing-PHASE-5-frontend-types-components.md)**
   - Update TypeScript types
   - Create reusable UI components
   - **Estimate:** 2-3 hours

6. **[Phase 6: Main UI Updates](./setlist-sharing-PHASE-6-main-ui-updates.md)**
   - Update SetlistCard, SetlistForm, SetlistPage
   - Add "Shared With Me" section
   - **Estimate:** 3-4 hours

7. **[Phase 7: Browse Page & Anonymous](./setlist-sharing-PHASE-7-browse-anonymous.md)**
   - Create browse page with filters
   - Add anonymous favorites (localStorage)
   - Add warning banners
   - **Estimate:** 3-4 hours

8. **[Phase 8: Final Polish](./setlist-sharing-PHASE-8-final-polish.md)**
   - Create share dialog
   - Add profile integration
   - Handle broken references
   - Add offline support
   - **Estimate:** 3-4 hours

**Total Estimated Time:** 20-26 hours

## Each Phase Includes

- ✅ **Prerequisites:** What must be completed first
- 📝 **Code Changes:** Specific files and implementations
- 🧪 **Testing Steps:** How to verify it works
- 📊 **Dependencies:** Which phases it builds on

## Implementation Tips

### For AI-Assisted Development
Each phase is designed to work with fresh context:

```
"Let's implement Phase 1: Backend Foundation from the plan at docs/implementation-plans/"
```

After completing Phase 1, in a new session:

```
"Let's implement Phase 2: Core Sharing Mutations from docs/implementation-plans/"
```

### For Manual Development
1. Check off prerequisites
2. Follow code changes in order
3. Run testing steps after each section
4. Move to next phase only when current phase passes all tests

## Testing Checklist

After completing all phases, verify these scenarios:

### Privacy Flow
- [ ] Create private setlist → not visible to others
- [ ] Change to unlisted → shareable via link
- [ ] Change to public → appears in browse
- [ ] Revert to private → removed from browse

### Sharing
- [ ] Share with user (view-only) → they can view but not edit
- [ ] Upgrade to edit → they can now edit
- [ ] Remove access → they can no longer view
- [ ] Shared setlist appears in "Shared With Me"

### Browse & Discovery
- [ ] Public setlists appear in `/setlists/browse`
- [ ] Filters work (tags, duration, song count)
- [ ] Sorting works (popular, recent, A-Z)
- [ ] Search by name/description works

### Duplication
- [ ] Duplicate creates private copy
- [ ] Attribution shows original source
- [ ] Attribution can be toggled off
- [ ] Works even if original is deleted/private

### Favorites
- [ ] Authenticated users can favorite setlists
- [ ] Anonymous users can favorite (localStorage)
- [ ] Favorites appear in user's favorites list
- [ ] Warning shown to anonymous users

### User Profiles
- [ ] Public setlists appear on user profile
- [ ] Private setlists hidden from profile
- [ ] Only owned public setlists shown

### Offline
- [ ] Setlists cache for offline viewing
- [ ] Offline indicator shows when disconnected
- [ ] Cached version loads when offline

### Broken References
- [ ] Deleted arrangements show "[Unavailable]"
- [ ] Setlist still viewable with placeholders
- [ ] Duplication includes unavailable entries

## Architecture Decisions

Key decisions made in this implementation:

1. **Privacy Levels as Enum:** Clear tri-state (private/unlisted/public) instead of boolean flags
2. **Explicit Sharing Array:** `sharedWith` array for granular permission control
3. **Denormalized Favorites Counter:** Performance optimization for browse/sort
4. **Owner-Only Privacy Changes:** Security safeguard preventing collaborators from changing visibility
5. **Offline-First Caching:** Critical for worship service use case
6. **Anonymous localStorage Favorites:** Consistent with songs/arrangements pattern

## Post-Implementation

After completing all phases:

1. **Run migrations:**
   ```bash
   # Via Convex dashboard → Functions → Internal
   # Run: migrations:migrateSetlistsToPrivacy
   ```

2. **Type check:**
   ```bash
   npm run typecheck
   ```

3. **Lint:**
   ```bash
   npm run lint
   ```

4. **Update documentation:**
   - Mark Phase 11 complete in [PROJECT_STATUS.md](../../PROJECT_STATUS.md)
   - Add any architectural decisions or learnings

5. **Deploy:**
   - Test in staging environment
   - Run full E2E test suite
   - Deploy to production

## Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - AI context for this project
- [PROJECT_STATUS.md](../../PROJECT_STATUS.md) - Current project status
- [POST_MVP_ROADMAP.md](../../POST_MVP_ROADMAP.md) - Future features

## Questions or Issues?

If you encounter issues during implementation:
1. Check the testing steps in each phase
2. Review the full plan for architectural context
3. Consult existing patterns in songs/arrangements features
4. Ask for clarification before making assumptions

---

**Generated:** 2026-01-27
**Status:** Ready for implementation
**Complexity:** Large (8 phases, 20-26 hours estimated)
