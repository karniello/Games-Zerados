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
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar: string;
  gamerTag: string;
  favoritePlatform: string;
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
  | 'backup';

