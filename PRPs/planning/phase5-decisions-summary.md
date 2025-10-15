# Phase 5: Approved Decisions Summary

**Date**: 2025-10-14
**Status**: ✅ Approved - Ready for Implementation
**Related PRD**: [phase5-data-model-supabase-schema-prd.md](./phase5-data-model-supabase-schema-prd.md)

---

## Approved Architecture Decisions

### 1. Data Ownership Model: Hybrid Community Library ✅

**Decision**: Use a hybrid model where:
- **Songs**: Global community library (anyone can contribute)
- **Arrangements**: User-owned (creator can edit/delete)
- **Setlists**: User-owned and private
- **Ratings/Favorites**: User-specific actions

**Rationale**:
- Balances collaboration (shared songs) with personalization (custom arrangements)
- Aligns with worship team use case (standard songs, custom arrangements)
- Enables social features in future phases (ratings, favorites)

**Impact**:
- All tables require `created_by` or `user_id` foreign keys
- RLS policies differentiate between read (public) and write (owner-only) access
- Enables future features like "featured arrangements" and "popular songs"

---

### 2. Authentication: Email/Password Only (Phase 5) ✅

**Decision**: Implement email/password authentication for MVP. Defer OAuth to Phase 6+.

**Rationale**:
- Faster implementation (1 provider vs. 3+)
- Fewer external dependencies (no Google/Apple API keys)
- Supabase Auth handles password reset, email verification out-of-the-box
- OAuth can be added incrementally without breaking changes

**Implementation**:
- Use Supabase Auth built-in email/password
- Email verification required for signup
- Password reset via email link
- Session persistence in localStorage (handled by Supabase client)

**Deferred to Phase 6**:
- Google OAuth (Sign in with Google)
- Apple Sign-In (for iOS PWA)
- Magic link authentication

---

### 3. Supabase Pricing: Free Tier (Phase 5) ✅

**Decision**: Start with Supabase Free Tier. Upgrade to Pro when hitting limits.

**Free Tier Limits**:
- 500 MB database storage
- 2 GB bandwidth per month
- 50,000 monthly active users
- 2 GB file storage
- 500 MB Edge Functions invocations

**Expected Usage (MVP - 100 users)**:
- Database: ~50 MB (500 songs × 100 KB avg)
- Bandwidth: ~500 MB/month (5 MB per user)
- MAUs: 100 users
- **Verdict**: Free tier sufficient for 6-12 months

**Upgrade Triggers** (move to Pro $25/mo):
- Database >400 MB (80% of limit)
- Bandwidth >1.6 GB/month (80% of limit)
- Need for point-in-time recovery (Pro feature)
- Need for custom domain (Pro feature)

---

### 4. Conflict Resolution: Modal with Diff View ✅

**Decision**: Use a modal with side-by-side diff view for conflict resolution.

**UX Flow**:
1. User edits arrangement offline (Device A)
2. Same arrangement edited on Device B
3. Device A comes online, sync detects version mismatch
4. Modal appears: "Conflict detected for [Arrangement Name]"
5. Side-by-side view:
   - **Left**: "Your version (edited 2 hours ago)"
   - **Right**: "Server version (edited 5 minutes ago)"
   - Diff highlights: green = added, red = removed, yellow = changed
6. User chooses: **[Keep Mine]** or **[Use Server Version]**
7. Selected version wins, version incremented, synced to server

**Alternative Considered**:
- Last-write-wins (no prompt) - Rejected: Risk of silent data loss
- Inline notification - Rejected: Less clear what changed
- Settings page - Rejected: Too hidden, user might miss conflict

**Future Enhancement (Phase 6+)**:
- Three-way merge (like Git): "Base", "Mine", "Theirs"
- Manual merge editor (pick chunks from each version)
- CRDTs for automatic conflict-free merges

---

### 5. Real-Time Subscriptions: Arrangements & Setlists Only ✅

**Decision**: Enable Supabase real-time subscriptions for:
- ✅ **Arrangements** (high edit frequency)
- ✅ **Setlists** (high edit frequency)
- ❌ **Songs** (low edit frequency, mostly read-only)
- ❌ **Ratings/Favorites** (low priority for real-time)

**Rationale**:
- Arrangements: Users edit during practice sessions, want live updates
- Setlists: Users adjust setlists during rehearsals, need immediate sync
- Songs: Rarely edited once created, polling acceptable
- Ratings/Favorites: Nice-to-have, not critical for real-time

**Technical Implementation**:
```typescript
// Subscribe to arrangement changes
const arrangementChannel = supabase
  .channel('arrangements')
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'arrangements',
      filter: `created_by=eq.${userId}` // Only subscribe to user's arrangements
    },
    (payload) => {
      // Update IndexedDB cache
      handleArrangementChange(payload);
    }
  )
  .subscribe();

// Similar for setlists
const setlistChannel = supabase
  .channel('setlists')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'setlists',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      handleSetlistChange(payload);
    }
  )
  .subscribe();
```

**Performance Impact**:
- Real-time subscriptions: ~10 events/second limit (Supabase default)
- Expected load: <1 event/second per user (worst case: typing in editor)
- Bandwidth: Minimal (only changed rows transmitted)

---

## Implementation Timeline

### Phase 5.1: Foundation (Week 1-2, 16-20 hours)
- Set up Supabase project (Free tier)
- Run SQL migration (create tables, RLS policies)
- Implement email/password authentication
- Dual-write to IndexedDB + Supabase

### Phase 5.2: Sync Infrastructure (Week 3-4, 20-24 hours)
- Implement sync queue
- Add conflict detection (version field comparison)
- Build modal with diff view for conflicts
- Background sync on network reconnect

### Phase 5.3: Real-Time & Optimization (Week 5-6, 16-20 hours)
- Enable real-time subscriptions (arrangements, setlists)
- Fetch from Supabase on app load
- Optimize with materialized views
- "Last synced" indicator

### Phase 5.4: "Add New Song" Form (Week 7, 8-12 hours)
- Build form with validation
- Auto-generate slug
- Wire up to Supabase
- Mobile-optimize layout

**Total Estimated Effort**: 60-76 hours (~2 months part-time)

---

## Schema Changes Required

### New Fields Added to Existing Types

**Song.types.ts**:
```typescript
// ADDED
createdBy?: string; // UUID of creator (null for legacy songs)
```

**Arrangement.types.ts**:
```typescript
// ADDED
createdBy: string; // UUID of creator (required)
averageRating?: number; // Computed from user_arrangement_ratings
ratingCount?: number; // Count of ratings
favoritesCount?: number; // Count of favorites
version: number; // For optimistic locking (default: 1)

// REMOVED (migrated to computed fields)
rating: number; // NOW: averageRating (computed)
favorites: number; // NOW: favoritesCount (computed)
```

**Setlist.types.ts**:
```typescript
// ADDED
userId: string; // UUID of owner (required)
version: number; // For optimistic locking (default: 1)
```

### New Types Created

1. **UserProfile** - Extends Supabase Auth user
2. **UserArrangementRating** - User's rating for an arrangement
3. **UserArrangementFavorite** - User's favorite bookmark
4. **SyncQueueItem** - Offline sync queue entry (already exists in Database.types.ts)

---

## Migration Checklist

### Pre-Migration (Preparation)
- [ ] Create Supabase project (free tier)
- [ ] Save Supabase URL and anon key to `.env.local`
- [ ] Review SQL migration script (section 3.2 in PRD)
- [ ] Test SQL script in Supabase SQL editor
- [ ] Verify all RLS policies created correctly
- [ ] Generate TypeScript types from Supabase schema

### Phase 5.1 (Dual Write)
- [ ] Install `@supabase/supabase-js` package
- [ ] Create `src/lib/supabase.ts` client setup
- [ ] Create `SupabaseProvider` React context
- [ ] Implement email/password signup flow
- [ ] Implement email/password login flow
- [ ] Update repositories to write to Supabase (in addition to IndexedDB)
- [ ] Add "Sign in to sync" banner
- [ ] Test CRUD operations with RLS policies

### Phase 5.2 (Sync Queue)
- [ ] Implement sync queue in IndexedDB
- [ ] Create `SyncService` to process queue
- [ ] Add online/offline detection
- [ ] Implement retry logic (exponential backoff)
- [ ] Build conflict resolution modal
- [ ] Add sync status indicator
- [ ] Test offline → online sync

### Phase 5.3 (Real-Time)
- [ ] Enable real-time subscriptions (arrangements, setlists)
- [ ] Update IndexedDB cache on real-time events
- [ ] Fetch from Supabase on app load
- [ ] Add "Last synced" timestamp
- [ ] Test multi-device sync
- [ ] Optimize query performance

### Phase 5.4 (Add Song Form)
- [ ] Create `AddSongPage` component
- [ ] Implement form validation (React Hook Form + Zod)
- [ ] Add theme multi-select dropdown
- [ ] Wire up to Supabase
- [ ] Test form submission
- [ ] Mobile-optimize layout

---

## Success Criteria (Phase 5 Complete)

### Technical
- ✅ All tables have RLS policies enabled
- ✅ Email/password authentication works
- ✅ Users can sign up, log in, log out
- ✅ CRUD operations write to both IndexedDB and Supabase
- ✅ Offline edits sync when online
- ✅ Conflicts detected and resolution UI shown
- ✅ Real-time subscriptions update IndexedDB cache
- ✅ Multi-device sync works (test on 2+ devices)
- ✅ "Add Song" form creates songs in Supabase

### User Experience
- ✅ App still works offline (no regressions)
- ✅ Sync status visible to user
- ✅ "Last synced" timestamp displays
- ✅ Conflict resolution is clear and user-friendly
- ✅ No data loss reported
- ✅ Fast performance (<500ms API latency)

### Security
- ✅ RLS policies prevent unauthorized access
- ✅ Users can only edit their own arrangements/setlists
- ✅ Songs are readable by everyone, writable by creator
- ✅ No service_role key exposed on frontend
- ✅ Session tokens refresh automatically

---

## Next Steps

1. **Create Phase 5.1 Implementation PRP** - Detailed task-level breakdown
2. **Set up Supabase project** - Create project, run SQL migration
3. **Generate TypeScript types** - Run `supabase gen types`
4. **Begin implementation** - Start with authentication flow

---

**Document Status**: ✅ Approved for Implementation
**Last Updated**: 2025-10-14
**Owner**: HSA Songbook Development Team