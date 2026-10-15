-- Supabase Migration: 20261015000000_create_gamevault_schema.sql
-- Application: GameVault (Diário de Jogos Zerados)

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT,
  name TEXT,
  avatar_url TEXT,
  gamer_tag TEXT,
  favorite_platform TEXT DEFAULT 'PlayStation 5',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Games Table (Catálogo de Jogos Zerados)
CREATE TABLE IF NOT EXISTS public.games (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  thumbnail TEXT NOT NULL,
  platform TEXT NOT NULL,
  genre TEXT NOT NULL,
  completion_condition TEXT NOT NULL,
  rating REAL NOT NULL DEFAULT 8.0,
  difficulty TEXT NOT NULL DEFAULT 'Normal',
  hours REAL NOT NULL DEFAULT 0,
  completed_date TEXT NOT NULL,
  release_year INTEGER,
  developer TEXT,
  publisher TEXT,
  synopsis TEXT,
  notes TEXT,
  favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Yearly Goals Table (Metas Anuais e Backlog)
CREATE TABLE IF NOT EXISTS public.yearly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  target_games INTEGER NOT NULL DEFAULT 12,
  target_hours REAL DEFAULT 200,
  notes TEXT,
  backlog JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT yearly_goals_user_year_unique UNIQUE (user_id, year)
);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_games_user_id ON public.games(user_id);
CREATE INDEX IF NOT EXISTS idx_games_completed_date ON public.games(completed_date);
CREATE INDEX IF NOT EXISTS idx_games_rating ON public.games(rating);
CREATE INDEX IF NOT EXISTS idx_yearly_goals_user_year ON public.yearly_goals(user_id, year);

-- 6. Row Level Security (RLS) Configuration
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yearly_goals ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Games Policies
CREATE POLICY "Users can view their own games" 
  ON public.games FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own games" 
  ON public.games FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own games" 
  ON public.games FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own games" 
  ON public.games FOR DELETE 
  USING (auth.uid() = user_id);

-- Yearly Goals Policies
CREATE POLICY "Users can view their own yearly goals" 
  ON public.yearly_goals FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own yearly goals" 
  ON public.yearly_goals FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own yearly goals" 
  ON public.yearly_goals FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own yearly goals" 
  ON public.yearly_goals FOR DELETE 
  USING (auth.uid() = user_id);

-- 7. Trigger to automatically create profile on Supabase Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, username, avatar_url, gamer_tag)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'user_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || new.id::text),
    UPPER(COALESCE(new.raw_user_meta_data->>'user_name', split_part(new.email, '@', 1))) || '#' || floor(random() * 9000 + 1000)::text
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Updated At Timestamp Trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_games_updated_at ON public.games;
CREATE TRIGGER tr_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_yearly_goals_updated_at ON public.yearly_goals;
CREATE TRIGGER tr_yearly_goals_updated_at
  BEFORE UPDATE ON public.yearly_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
