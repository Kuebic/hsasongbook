-- Phase 5: Authentication Flow Database Schema
-- HSA Songbook - Supabase Migration
--
-- Features:
-- - User-owned data (songs, arrangements, setlists, preferences)
-- - Row Level Security (RLS) policies
-- - Anonymous user support
-- - Public/private content flags
--
-- Run this migration via Supabase CLI:
-- supabase db push
--
-- Or via Supabase Dashboard:
-- Project Settings → Database → Run SQL

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SONGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  artist TEXT,
  slug TEXT UNIQUE NOT NULL,

  -- Phase 5: Auth fields
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT title_not_empty CHECK (char_length(trim(title)) > 0),
  CONSTRAINT slug_not_empty CHECK (char_length(trim(slug)) > 0)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_songs_user_id ON public.songs(user_id);
CREATE INDEX IF NOT EXISTS idx_songs_slug ON public.songs(slug);
CREATE INDEX IF NOT EXISTS idx_songs_is_public ON public.songs(is_public);

-- Enable RLS
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for songs
CREATE POLICY "Public songs are viewable by everyone"
  ON public.songs FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own songs"
  ON public.songs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create songs"
  ON public.songs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own songs"
  ON public.songs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own songs"
  ON public.songs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- ARRANGEMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.arrangements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  chord_pro_content TEXT NOT NULL,

  -- Metadata
  arranger TEXT,
  key TEXT,
  tempo INTEGER,
  time_signature TEXT,
  capo INTEGER,
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'intermediate', 'advanced')),

  -- Stats
  rating_average DECIMAL(3,2) DEFAULT 0.0,
  rating_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,

  -- Phase 5: Auth fields
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT name_not_empty CHECK (char_length(trim(name)) > 0),
  CONSTRAINT slug_not_empty CHECK (char_length(trim(slug)) > 0),
  CONSTRAINT rating_average_range CHECK (rating_average >= 0 AND rating_average <= 5),
  CONSTRAINT tempo_positive CHECK (tempo IS NULL OR tempo > 0),
  CONSTRAINT capo_range CHECK (capo IS NULL OR (capo >= 0 AND capo <= 12))
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_arrangements_song_id ON public.arrangements(song_id);
CREATE INDEX IF NOT EXISTS idx_arrangements_user_id ON public.arrangements(user_id);
CREATE INDEX IF NOT EXISTS idx_arrangements_slug ON public.arrangements(slug);
CREATE INDEX IF NOT EXISTS idx_arrangements_is_public ON public.arrangements(is_public);

-- Enable RLS
ALTER TABLE public.arrangements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for arrangements
CREATE POLICY "Public arrangements are viewable by everyone"
  ON public.arrangements FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own arrangements"
  ON public.arrangements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create arrangements"
  ON public.arrangements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own arrangements"
  ON public.arrangements FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own arrangements"
  ON public.arrangements FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SETLISTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.setlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  performance_date DATE,

  -- Songs in setlist (JSON array)
  -- Format: [{ arrangementId, customKey }]
  songs JSONB DEFAULT '[]'::jsonb,

  -- Phase 5: Auth fields (setlists are always private)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT name_not_empty CHECK (char_length(trim(name)) > 0)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_setlists_user_id ON public.setlists(user_id);
CREATE INDEX IF NOT EXISTS idx_setlists_performance_date ON public.setlists(performance_date);

-- Enable RLS
ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for setlists (private by default)
CREATE POLICY "Users can view their own setlists"
  ON public.setlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create setlists"
  ON public.setlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own setlists"
  ON public.setlists FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own setlists"
  ON public.setlists FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- USER PREFERENCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Preferences
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  default_key TEXT DEFAULT 'C',
  auto_sync BOOLEAN DEFAULT true,
  sync_on_mobile_data BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user preferences (private)
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
  ON public.user_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_songs_updated_at
  BEFORE UPDATE ON public.songs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_arrangements_updated_at
  BEFORE UPDATE ON public.arrangements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_setlists_updated_at
  BEFORE UPDATE ON public.setlists
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- ANONYMOUS USER SUPPORT
-- ============================================================================

-- Note: Anonymous users are handled by Supabase Auth automatically.
-- They get a temporary user ID that can be converted to authenticated later.
-- No special database setup required beyond allowing NULL user_id temporarily.

-- ============================================================================
-- NOTES FOR DEPLOYMENT
-- ============================================================================

-- 1. Enable anonymous sign-in in Supabase Dashboard:
--    Project Settings → Auth → User Signups → Enable Anonymous sign-ins

-- 2. Configure email templates (optional):
--    Authentication → Email Templates → Customize messages

-- 3. Set up environment variables in frontend:
--    VITE_SUPABASE_URL=<your-supabase-url>
--    VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<your-anon-key>

-- 4. Test RLS policies:
--    - Anonymous users: Can view public content only
--    - Authenticated users: Can CRUD their own content
--    - Cannot access other users' private content

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
