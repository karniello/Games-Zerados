import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Game, UserProfile, YearlyGoal } from '../types';

export { isSupabaseConfigured };

export async function getSupabaseProfile(): Promise<UserProfile | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return null;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.warn('Error fetching Supabase profile:', profileError);
    }

    if (profile) {
      return {
        id: profile.id,
        username: profile.username || user.email?.split('@')[0] || 'gamer',
        name: profile.name || user.user_metadata?.full_name || 'Gamer',
        email: profile.email || user.email || '',
        avatar: profile.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`,
        gamerTag: profile.gamer_tag || `${(profile.username || 'GAMER').toUpperCase()}#1000`,
        favoritePlatform: profile.favorite_platform || 'PlayStation 5',
      };
    }

    return {
      id: user.id,
      username: user.email?.split('@')[0] || 'gamer',
      name: user.user_metadata?.full_name || 'Gamer',
      email: user.email || '',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`,
      gamerTag: `${(user.email?.split('@')[0] || 'GAMER').toUpperCase()}#1000`,
      favoritePlatform: 'PlayStation 5',
    };
  } catch (err) {
    console.warn('Failed to get Supabase profile:', err);
    return null;
  }
}

export async function fetchSupabaseGames(): Promise<Game[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('games')
    .select('*')
    .order('completed_date', { ascending: false });

  if (error) {
    console.error('Error fetching games from Supabase:', error);
    throw error;
  }

  return (data || []).map((r: any) => ({
    id: r.id,
    title: r.title,
    thumbnail: r.thumbnail,
    platform: r.platform,
    genre: r.genre,
    completionCondition: r.completion_condition as any,
    rating: r.rating,
    difficulty: r.difficulty as any,
    hours: r.hours,
    completedDate: r.completed_date,
    releaseYear: r.release_year ?? undefined,
    developer: r.developer ?? undefined,
    publisher: r.publisher ?? undefined,
    synopsis: r.synopsis ?? undefined,
    notes: r.notes ?? undefined,
    favorite: !!r.favorite,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function saveSupabaseGame(
  game: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>,
  existingId?: string
): Promise<Game> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase URL ou Anon Key não configuradas no ambiente.');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário Supabase não autenticado.');

  const payload: any = {
    user_id: user.id,
    title: game.title,
    thumbnail: game.thumbnail,
    platform: game.platform,
    genre: game.genre,
    completion_condition: game.completionCondition,
    rating: game.rating,
    difficulty: game.difficulty,
    hours: game.hours,
    completed_date: game.completedDate,
    release_year: game.releaseYear ?? null,
    developer: game.developer ?? null,
    publisher: game.publisher ?? null,
    synopsis: game.synopsis ?? null,
    notes: game.notes ?? null,
    favorite: !!game.favorite,
  };

  if (existingId) {
    const { data, error } = await supabase
      .from('games')
      .update(payload)
      .eq('id', existingId)
      .select()
      .single();

    if (error) throw error;
    return {
      ...game,
      id: data.id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  const { data, error } = await supabase
    .from('games')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return {
    ...game,
    id: data.id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function deleteSupabaseGame(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { error } = await supabase.from('games').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function toggleSupabaseGameFavorite(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { data: current, error: fetchErr } = await supabase
    .from('games')
    .select('favorite')
    .eq('id', id)
    .single();

  if (fetchErr || !current) throw fetchErr;

  const nextVal = !current.favorite;
  const { error } = await supabase
    .from('games')
    .update({ favorite: nextVal })
    .eq('id', id);

  if (error) throw error;
  return nextVal;
}

export async function syncSupabaseGames(gamesList: Game[]): Promise<Game[]> {
  if (!isSupabaseConfigured()) return gamesList;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário Supabase não autenticado.');

  // Delete existing games for user and insert new ones
  await supabase.from('games').delete().eq('user_id', user.id);

  if (gamesList.length === 0) return [];

  const records = gamesList.map((g) => ({
    id: g.id,
    user_id: user.id,
    title: g.title,
    thumbnail: g.thumbnail,
    platform: g.platform,
    genre: g.genre,
    completion_condition: g.completionCondition,
    rating: g.rating,
    difficulty: g.difficulty,
    hours: g.hours,
    completed_date: g.completedDate,
    release_year: g.releaseYear ?? null,
    developer: g.developer ?? null,
    publisher: g.publisher ?? null,
    synopsis: g.synopsis ?? null,
    notes: g.notes ?? null,
    favorite: !!g.favorite,
  }));

  const { error } = await supabase.from('games').insert(records);
  if (error) throw error;

  return fetchSupabaseGames();
}

export async function fetchSupabaseGoal(year: number): Promise<YearlyGoal | null> {
  if (!isSupabaseConfigured()) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('yearly_goals')
    .select('*')
    .eq('year', year)
    .single();

  if (error) return null;
  return {
    year: data.year,
    targetGames: data.target_games,
    targetHours: data.target_hours ?? 200,
    notes: data.notes ?? '',
    backlog: data.backlog || [],
  };
}

export async function saveSupabaseGoal(goal: YearlyGoal): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('yearly_goals').upsert({
    user_id: user.id,
    year: goal.year,
    target_games: goal.targetGames,
    target_hours: goal.targetHours ?? 200,
    notes: goal.notes ?? null,
    backlog: goal.backlog || [],
  });
}
