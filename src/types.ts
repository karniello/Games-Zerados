export type CompletionCondition = 
  | 'História Principal'
  | '100% / Colecionáveis'
  | 'Platina / Todas Conquistas'
  | 'DLC / Expansão'
  | 'Novo Jogo+ (New Game+)'
  | 'New Game+'
  | 'Speedrun / Qualquer%'
  | 'Speedrun / Any%';

export type GameDifficulty = 
  | 'Muito Fácil'
  | 'Fácil'
  | 'Normal'
  | 'Difícil'
  | 'Muito Difícil';

export type TrophyType = 'platinum' | 'gold' | 'silver' | 'bronze' | 'special';

export interface GameAchievement {
  id: string;
  title: string;
  description: string;
  type: TrophyType;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface Game {
  id: string;
  title: string;
  thumbnail: string;
  platform: string;
  genre: string;
  completionCondition: CompletionCondition;
  rating: number; // 0 to 10
  difficulty: GameDifficulty;
  hours: number;
  completedDate: string; // YYYY-MM-DD
  releaseYear?: number;
  developer?: string;
  publisher?: string;
  synopsis?: string;
  notes?: string;
  favorite?: boolean;
  achievements?: GameAchievement[];
  achievementSummary?: {
    title?: string;
    text: string;
    tone?: string;
    generatedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserPlatformLink {
  platformId: 'steam' | 'psn' | 'xbox' | 'nintendo' | 'retroachievements' | 'exophase' | 'epic' | 'gog';
  usernameOrId: string;
  customUrl?: string;
  connected: boolean;
  lastSyncedAt?: string;
  autoSync?: boolean;
  publicProfileUrl?: string;
  stats?: {
    gamesCount?: number;
    achievementsCount?: number;
    level?: string | number;
    gamerscore?: number;
    trophies?: {
      platinum?: number;
      gold?: number;
      silver?: number;
      bronze?: number;
    };
  };
}

export interface UserConnections {
  steam?: UserPlatformLink;
  psn?: UserPlatformLink;
  xbox?: UserPlatformLink;
  nintendo?: UserPlatformLink;
  retroachievements?: UserPlatformLink;
  exophase?: UserPlatformLink;
  epic?: UserPlatformLink;
  gog?: UserPlatformLink;
  rawgApiKey?: string;
  igdbClientId?: string;
  autoSyncOnLogin?: boolean;
  autoSyncGameAchievements?: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar: string;
  gamerTag: string;
  favoritePlatform: string;
  bio?: string;
  currentlyPlaying?: string;
  location?: string;
  connections?: UserConnections;
}

export interface BacklogItem {
  id: string;
  title: string;
  platform: string;
  thumbnail: string;
  estimatedHours?: number;
  addedAt: string;
}

export interface YearlyGoal {
  year: number;
  targetGames: number;
  targetHours?: number;
  notes?: string;
  backlog?: BacklogItem[];
}

export type ActiveTab = 
  | 'library' 
  | 'yearly' 
  | 'matrix' 
  | 'monthly' 
  | 'goals' 
  | 'analytics'
  | 'backup'
  | 'profile';


