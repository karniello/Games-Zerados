import { Game, UserProfile } from '../types';
import { INITIAL_GAMES } from '../constants/initialData';

const CURRENT_USER_KEY = 'gamevault_current_user';
const USERS_LIST_KEY = 'gamevault_registered_users';
const GAMES_STORAGE_PREFIX = 'gamevault_games_';

export interface StoredUser extends UserProfile {
  passwordHash: string;
}

export function getCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: UserProfile | null) {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function updateCurrentUserProfile(updatedFields: Partial<UserProfile>): UserProfile | null {
  const current = getCurrentUser();
  if (!current) return null;
  const merged: UserProfile = {
    ...current,
    ...updatedFields,
    connections: {
      ...current.connections,
      ...(updatedFields.connections || {}),
    },
  };
  setCurrentUser(merged);

  try {
    const users = getRegisteredUsers();
    const idx = users.findIndex(
      (u) => u.id === current.id || u.username.toLowerCase() === current.username.toLowerCase()
    );
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...merged };
      localStorage.setItem(USERS_LIST_KEY, JSON.stringify(users));
    }
  } catch {}

  return merged;
}

export function getRegisteredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_LIST_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function registerUser(username: string, passwordHash: string, name?: string, email?: string): UserProfile {
  const users = getRegisteredUsers();
  const existing = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (existing) {
    throw new Error('Nome de usuário já cadastrado.');
  }

  const newUser: StoredUser = {
    id: 'user_' + Date.now(),
    username: username.trim(),
    name: name?.trim() || username.trim(),
    email: email?.trim() || `${username.toLowerCase()}@gamer.local`,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
    gamerTag: `${username.toUpperCase()}#${Math.floor(1000 + Math.random() * 9000)}`,
    favoritePlatform: 'PlayStation 5',
    passwordHash,
  };

  users.push(newUser);
  localStorage.setItem(USERS_LIST_KEY, JSON.stringify(users));

  // Seed default games for the new user so they start with a vibrant library
  const userGamesKey = GAMES_STORAGE_PREFIX + newUser.id;
  if (!localStorage.getItem(userGamesKey)) {
    localStorage.setItem(userGamesKey, JSON.stringify(INITIAL_GAMES));
  }

  const { passwordHash: _, ...userProfile } = newUser;
  return userProfile;
}

export function loginUser(username: string, passwordInput: string): UserProfile {
  const users = getRegisteredUsers();
  const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  
  if (!user) {
    throw new Error('Usuário não encontrado.');
  }
  if (user.passwordHash !== passwordInput) {
    throw new Error('Senha incorreta.');
  }

  const { passwordHash: _, ...profile } = user;
  setCurrentUser(profile);
  return profile;
}

export function getGamesForUser(userId: string): Game[] {
  try {
    const key = GAMES_STORAGE_PREFIX + userId;
    const raw = localStorage.getItem(key);
    if (!raw) {
      // First time loading for this user: initialize with INITIAL_GAMES
      localStorage.setItem(key, JSON.stringify(INITIAL_GAMES));
      return INITIAL_GAMES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_GAMES;
  }
}

export function saveGamesForUser(userId: string, games: Game[]) {
  const key = GAMES_STORAGE_PREFIX + userId;
  localStorage.setItem(key, JSON.stringify(games));
}

const GOALS_STORAGE_PREFIX = 'gamevault_goals_';

export function getYearlyGoal(userId: string, year: number): {
  year: number;
  targetGames: number;
  targetHours?: number;
  notes?: string;
  backlog?: any[];
} {
  try {
    const key = `${GOALS_STORAGE_PREFIX}${userId}_${year}`;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    year,
    targetGames: 12, // 1 game per month default
    targetHours: 200,
    notes: 'Meta anual de zeramentos para manter o ritmo gamer!',
    backlog: [],
  };
}

export function saveYearlyGoal(userId: string, goal: any): void {
  const key = `${GOALS_STORAGE_PREFIX}${userId}_${goal.year}`;
  localStorage.setItem(key, JSON.stringify(goal));
}

// Backup & Export Helpers
export function createBackupJSON(games: Game[], user: UserProfile): string {
  const payload = {
    app: 'GameVault',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    user: {
      username: user.username,
      gamerTag: user.gamerTag,
    },
    totalGames: games.length,
    games,
  };
  return JSON.stringify(payload, null, 2);
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportGamesToCSV(games: Game[]): string {
  const headers = [
    'Título',
    'Console/Plataforma',
    'Gênero',
    'Condição de Zeramento',
    'Nota',
    'Dificuldade',
    'Tempo (Horas)',
    'Data de Conclusão',
    'Ano Lançamento',
    'Desenvolvedora',
    'Notas Pessoais',
  ];

  const rows = games.map((g) => [
    `"${(g.title || '').replace(/"/g, '""')}"`,
    `"${(g.platform || '').replace(/"/g, '""')}"`,
    `"${(g.genre || '').replace(/"/g, '""')}"`,
    `"${(g.completionCondition || '').replace(/"/g, '""')}"`,
    g.rating.toString(),
    `"${(g.difficulty || '').replace(/"/g, '""')}"`,
    g.hours.toString(),
    g.completedDate,
    g.releaseYear?.toString() || '',
    `"${(g.developer || '').replace(/"/g, '""')}"`,
    `"${(g.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
}

export interface RestoreResult {
  success: boolean;
  importedCount: number;
  games: Game[];
  error?: string;
}

export function parseAndValidateBackup(jsonString: string): RestoreResult {
  try {
    const data = JSON.parse(jsonString);
    let rawGames: any[] = [];

    if (Array.isArray(data)) {
      rawGames = data;
    } else if (data.games && Array.isArray(data.games)) {
      rawGames = data.games;
    } else {
      return { success: false, importedCount: 0, games: [], error: 'Arquivo inválido: nenhuma lista de jogos encontrada.' };
    }

    const validatedGames: Game[] = rawGames.map((item: any, idx: number) => ({
      id: item.id || `restored_${Date.now()}_${idx}`,
      title: item.title || 'Sem título',
      thumbnail: item.thumbnail || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
      platform: item.platform || 'PlayStation 5',
      genre: item.genre || 'Ação',
      completionCondition: item.completionCondition || 'História Principal',
      rating: typeof item.rating === 'number' ? Math.max(0, Math.min(10, item.rating)) : 8,
      difficulty: item.difficulty || 'Normal',
      hours: typeof item.hours === 'number' ? item.hours : 10,
      completedDate: item.completedDate || new Date().toISOString().split('T')[0],
      releaseYear: item.releaseYear,
      developer: item.developer,
      publisher: item.publisher,
      synopsis: item.synopsis,
      notes: item.notes || '',
      favorite: !!item.favorite,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
    }));

    return {
      success: true,
      importedCount: validatedGames.length,
      games: validatedGames,
    };
  } catch (err: any) {
    return {
      success: false,
      importedCount: 0,
      games: [],
      error: 'Falha ao processar arquivo JSON: ' + (err?.message || 'formato inválido'),
    };
  }
}
