import type { Game, UserProfile, YearlyGoal, GameAchievement } from '../types.ts';

export interface GameSearchResult {
  title: string;
  thumbnail: string;
  releaseYear?: number;
  developer?: string;
  publisher?: string;
  platforms?: string[];
  genres?: string[];
  averageHours?: number;
  synopsis?: string;
  source?: string;
}

export interface SearchStatus {
  rawgConfigured: boolean;
  igdbConfigured: boolean;
  geminiConfigured: boolean;
  activeProvider: string;
}

// In-memory token storage (per security guidelines: never stored in localStorage)
let inMemoryToken: string | null = null;

export function setAuthToken(token: string | null) {
  inMemoryToken = token;
}

export function getAuthToken(): string | null {
  return inMemoryToken;
}

function getAuthHeaders(overrideToken?: string) {
  const token = overrideToken || inMemoryToken;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchSearchStatus(): Promise<SearchStatus> {
  try {
    const res = await fetch('/api/games/search/status');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Erro ao checar status dos provedores de busca:', err);
  }
  return {
    rawgConfigured: false,
    igdbConfigured: false,
    geminiConfigured: false,
    activeProvider: 'Catálogo & Web',
  };
}

export async function searchGamesOnline(query: string, preferredProvider?: 'rawg' | 'igdb' | 'auto'): Promise<GameSearchResult[]> {
  try {
    const res = await fetch('/api/games/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, preferredProvider }),
    });

    if (!res.ok) {
      throw new Error('Falha na resposta do servidor.');
    }

    const data = await res.json();
    return data.games || [];
  } catch (error) {
    console.warn('Erro ao consultar backend, usando fallback local:', error);
    return [
      {
        title: query,
        thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
        releaseYear: new Date().getFullYear(),
        developer: 'Estúdio',
        platforms: ['PlayStation 5', 'PC (Steam / Epic)', 'Nintendo Switch', 'Xbox Series X/S'],
        genres: ['Ação', 'Aventura'],
        averageHours: 20,
        synopsis: `Cadastro rápido de ${query}.`,
        source: 'fallback',
      },
    ];
  }
}

export async function fetchGameSynopsis(title: string): Promise<{
  synopsis: string;
  developer?: string;
  releaseYear?: number;
  genres?: string[];
}> {
  try {
    const res = await fetch('/api/games/synopsis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Erro ao consultar endpoint de sinopse:', err);
  }

  return {
    synopsis: `${title} é uma jornada marcante com desafios empolgantes e narrativa envolvente.`,
  };
}

// Cloud Database APIs
export async function fetchCloudUser(token?: string): Promise<UserProfile | null> {
  try {
    const res = await fetch('/api/user/me', {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Failed to fetch cloud user:', err);
    return null;
  }
}

export async function updateCloudUser(profile: Partial<UserProfile>, token?: string): Promise<UserProfile | null> {
  try {
    const res = await fetch('/api/user/profile', {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(profile),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Failed to update cloud user:', err);
    return null;
  }
}

export async function fetchCloudGames(token?: string): Promise<Game[]> {
  const res = await fetch('/api/games', {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) throw new Error('Falha ao carregar jogos da nuvem');
  const data = await res.json();
  return data.games || [];
}

export async function saveCloudGame(
  game: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>,
  existingId?: string,
  token?: string
): Promise<Game> {
  const res = await fetch('/api/games', {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ game, existingId }),
  });
  if (!res.ok) throw new Error('Falha ao salvar jogo na nuvem');
  const data = await res.json();
  return data.game;
}

export async function deleteCloudGame(id: string, token?: string): Promise<boolean> {
  const res = await fetch(`/api/games/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  if (!res.ok) throw new Error('Falha ao remover jogo da nuvem');
  const data = await res.json();
  return !!data.success;
}

export async function toggleCloudGameFavorite(id: string, token?: string): Promise<boolean> {
  const res = await fetch(`/api/games/${id}/favorite`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
  });
  if (!res.ok) throw new Error('Falha ao alternar favorito');
  const data = await res.json();
  return !!data.favorite;
}

export async function syncCloudGames(gamesList: Game[], token?: string): Promise<Game[]> {
  const res = await fetch('/api/games/sync', {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ games: gamesList }),
  });
  if (!res.ok) throw new Error('Falha ao sincronizar jogos na nuvem');
  const data = await res.json();
  return data.games || [];
}

export async function fetchCloudGoal(year: number, token?: string): Promise<YearlyGoal | null> {
  try {
    const res = await fetch(`/api/goals/${year}`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.goal;
  } catch (err) {
    console.warn('Failed to fetch cloud goal:', err);
    return null;
  }
}

export async function saveCloudGoal(goal: YearlyGoal, token?: string): Promise<YearlyGoal | null> {
  try {
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ goal }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.goal;
  } catch (err) {
    console.warn('Failed to save cloud goal:', err);
    return null;
  }
}

export async function fetchGameAchievements(
  title: string,
  platform?: string
): Promise<GameAchievement[]> {
  try {
    const res = await fetch('/api/games/achievements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, platform }),
    });
    if (!res.ok) {
      throw new Error(`Falha ao buscar conquistas (${res.status})`);
    }
    const data = await res.json();
    return Array.isArray(data.achievements) ? data.achievements : [];
  } catch (err) {
    console.error('fetchGameAchievements error:', err);
    throw err;
  }
}

export interface SyncExternalResponse {
  achievements: GameAchievement[];
  unlockedCount: number;
  matchedNames: string[];
  source: string;
  message: string;
  error?: string;
}

export async function syncExternalAchievements(params: {
  gameTitle: string;
  trackerType: string;
  profileUrlOrId: string;
  pastedText?: string;
  currentAchievements: GameAchievement[];
}): Promise<SyncExternalResponse> {
  const res = await fetch('/api/games/achievements/sync-external', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao sincronizar com rastreador externo');
  }
  return data;
}

export async function testPlatformConnection(params: {
  platformId: string;
  usernameOrId: string;
  customUrl?: string;
}): Promise<{
  platformId: string;
  usernameOrId: string;
  connected: boolean;
  message: string;
  stats?: any;
  lastSyncedAt: string;
}> {
  const res = await fetch('/api/user/connections/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao testar vinculação');
  }
  return data;
}

export interface AchievementSummaryResult {
  title: string;
  text: string;
  tone: string;
  generatedAt: string;
}

export async function generateAchievementSummary(params: {
  gameTitle: string;
  platform?: string;
  hours?: number;
  rating?: number;
  difficulty?: string;
  completionCondition?: string;
  totalAchievements: number;
  unlockedAchievements: number;
  achievementsList?: Array<{ title: string; unlocked: boolean; type?: string }>;
}): Promise<AchievementSummaryResult> {
  const res = await fetch('/api/games/achievements/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao gerar resumo motivacional de conquistas');
  }
  return data;
}



