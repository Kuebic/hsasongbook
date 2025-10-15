# Supabase Database Schema

This directory contains SQL migrations for the HSA Songbook Supabase database.

## Phase 5: Authentication Flow (20250115000000)

This migration sets up the complete database schema for Phase 5, including:

- **Tables**: songs, arrangements, setlists, user_preferences
- **Row Level Security (RLS)**: Policies for user-owned data
- **Anonymous Auth Support**: Handles anonymous → authenticated conversion
- **Public/Private Content**: Songs and arrangements can be public or private

## Prerequisites

1. **Supabase Account**: Create a project at [supabase.com](https://supabase.com)
2. **Supabase CLI** (optional, for local development):
   ```bash
   npm install -g supabase
   ```

## Applying the Migration

### Option 1: Supabase Dashboard (Recommended for first-time setup)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New query**
4. Copy and paste the contents of `migrations/20250115000000_phase5_auth_schema.sql`
5. Click **Run** (bottom right)
6. Verify tables created: **Table Editor** → Check for songs, arrangements, setlists, user_preferences

### Option 2: Supabase CLI (For local development)

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref <your-project-ref>

# Apply migrations
supabase db push
```

## Post-Migration Setup

### 1. Enable Anonymous Sign-In

1. Go to **Project Settings** → **Authentication**
2. Under **User Signups**, enable **Anonymous sign-ins**
3. Save changes

### 2. Configure Environment Variables

Update your `.env` file:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<your-anon-key>
```

Find these values in:
- **Project Settings** → **API** → **Project URL** and **anon public** key

### 3. Verify RLS Policies

Test the following scenarios in the **SQL Editor**:

```sql
-- Test as anonymous user (should only see public content)
SELECT * FROM public.songs WHERE is_public = true;

-- Test as authenticated user (should see own content)
-- (Run after signing in via the app)
SELECT * FROM public.songs WHERE user_id = auth.uid();
```

## Schema Overview

### Songs Table
- Stores song metadata (title, artist, slug)
- Public/private flag
- User-owned via `user_id`

### Arrangements Table
- ChordPro content for each song arrangement
- Metadata: key, tempo, capo, time signature
- Stats: rating, view count
- Public/private flag
- User-owned via `user_id`

### Setlists Table
- Named collections of arrangements
- Performance date tracking
- **Always private** (no public sharing in Phase 5)
- User-owned via `user_id`

### User Preferences Table
- Theme preference (light/dark/system)
- Default key for transposition
- Sync settings
- **Always private**

## Row Level Security (RLS) Policies

All tables have RLS enabled with the following policies:

### Public Content (Songs & Arrangements)
- ✅ **SELECT**: Everyone can view public content
- ✅ **SELECT**: Users can view their own private content
- ✅ **INSERT/UPDATE/DELETE**: Users can manage their own content

### Private Content (Setlists & Preferences)
- ✅ **SELECT**: Users can only view their own data
- ✅ **INSERT/UPDATE/DELETE**: Users can only manage their own data

### Anonymous Users
- Can view public songs and arrangements
- Cannot create content (must convert to authenticated)
- Local content stays in IndexedDB until sign-in

## Troubleshooting

### Migration Fails with "already exists" Error
The migration uses `IF NOT EXISTS` clauses, so it's safe to re-run. If you see errors:
1. Check if tables already exist: **Table Editor**
2. Drop and recreate if needed (⚠️ **WARNING**: This deletes all data)

### RLS Blocks All Queries
Check that policies are correctly applied:
```sql
-- View all policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### Can't Access Data After Sign-In
Verify `user_id` is set correctly:
```sql
-- Check your user ID
SELECT auth.uid();

-- Check songs with correct user_id
SELECT * FROM public.songs WHERE user_id = auth.uid();
```

## Next Steps

After applying this migration:

1. ✅ **Test Anonymous Sign-In**: Open app, verify anonymous user created
2. ✅ **Test Sign-Up**: Create account, verify user record created
3. ✅ **Test Data Access**: Create song/arrangement, verify RLS works
4. ✅ **Test Sync**: Upload local IndexedDB data to Supabase (Phase 5.2)

## Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Anonymous Auth Pattern](https://supabase.com/docs/guides/auth/auth-anonymous)
