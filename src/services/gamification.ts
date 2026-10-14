import { Game } from '../types';

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji or Lucide name
  category: 'games' | 'trophy' | 'difficulty' | 'time' | 'variety' | 'special';
  unlocked: boolean;
  unlockedAt?: string;
  currentProgress: number;
  maxProgress: number;
  xpReward: number;
  color: string;
}

export interface PlayerLevel {
  level: number;
  title: string;
  minXp: number;
  maxXp: number;
  badgeIcon: string;
  gradient: string;
}

export const PLAYER_LEVELS: PlayerLevel[] = [
  {
    level: 1,
    title: 'Novato dos Games',
    minXp: 0,
    maxXp: 200,
    badgeIcon: '🎮',
    gradient: 'from-zinc-500 to-zinc-700',
  },
  {
    level: 2,
    title: 'Aventureiro de Fim de Semana',
    minXp: 200,
    maxXp: 500,
    badgeIcon: '⚔️',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    level: 3,
    title: 'Zerador Consistente',
    minXp: 500,
    maxXp: 900,
    badgeIcon: '🛡️',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    level: 4,
    title: 'Mestre dos Controles',
    minXp: 900,
    maxXp: 1500,
    badgeIcon: '🕹️',
    gradient: 'from-purple-500 to-pink-600',
  },
  {
    level: 5,
    title: 'Caçador de Troféus',
    minXp: 1500,
    maxXp: 2300,
    badgeIcon: '🏆',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    level: 6,
    title: 'Veterano Lendário',
    minXp: 2300,
    maxXp: 3400,
    badgeIcon: '💎',
    gradient: 'from-rose-500 to-red-600',
  },
  {
    level: 7,
    title: 'Deus do Videogame',
    minXp: 3400,
    maxXp: 5000,
    badgeIcon: '👑',
    gradient: 'from-amber-300 via-yellow-500 to-amber-600',
  },
];

export interface GamificationState {
  totalXp: number;
  currentLevel: PlayerLevel;
  nextLevel: PlayerLevel | null;
  xpInCurrentLevel: number;
  xpRequiredForNext: number;
  levelProgressPercent: number;
  badges: Badge[];
  unlockedCount: number;
  totalBadgesCount: number;
}

export function calculateGamification(games: Game[]): GamificationState {
  const totalGames = games.length;
  const totalHours = games.reduce((s, g) => s + (g.hours || 0), 0);
  const platCount = games.filter(
    (g) => g.completionCondition.includes('Platina') || g.completionCondition.includes('100%')
  ).length;
  const hardCount = games.filter((g) => g.difficulty === 'Muito Difícil').length;
  const score10Count = games.filter((g) => g.rating >= 10).length;
  const distinctPlatforms = new Set(games.map((g) => g.platform)).size;
  const distinctGenres = new Set(games.map((g) => g.genre)).size;
  const retroCount = games.filter((g) => {
    const isOldYear = g.releaseYear && g.releaseYear <= 2005;
    const isRetroPlatform = ['Super Nintendo (SNES)', 'Nintendo 64', 'PlayStation 1', 'PlayStation 2', 'Emulador / Retrogaming'].includes(g.platform);
    return isOldYear || isRetroPlatform;
  }).length;

  // Base XP formula:
  // Each game: 100 XP
  // Platina/100%: +50 XP
  // Muito Difícil: +50 XP
  // Long games (+40h): +40 XP
  // Score 10: +30 XP
  let baseGameXp = 0;
  games.forEach((g) => {
    baseGameXp += 100;
    if (g.completionCondition.includes('Platina') || g.completionCondition.includes('100%')) baseGameXp += 50;
    if (g.difficulty === 'Muito Difícil') baseGameXp += 50;
    if (g.hours >= 40) baseGameXp += 40;
    if (g.rating >= 10) baseGameXp += 30;
  });

  // Badges Definitions
  const badgeDefs: Omit<Badge, 'unlocked' | 'currentProgress'>[] = [
    {
      id: 'first_game',
      title: 'Primeiro Passo',
      description: 'Zerou o 1º jogo e começou sua história no GameVault.',
      icon: '🎮',
      category: 'games',
      maxProgress: 1,
      xpReward: 50,
      color: 'from-emerald-400 to-teal-500',
    },
    {
      id: 'trilogy',
      title: 'Trilogia Gamer',
      description: 'Zerou 3 jogos diferentes.',
      icon: '⚔️',
      category: 'games',
      maxProgress: 3,
      xpReward: 100,
      color: 'from-blue-400 to-indigo-500',
    },
    {
      id: 'ten_club',
      title: 'Dezena de Glória',
      description: 'Alcançou a marca épica de 10 jogos zerados.',
      icon: '🛡️',
      category: 'games',
      maxProgress: 10,
      xpReward: 200,
      color: 'from-indigo-400 to-purple-500',
    },
    {
      id: 'quarter_century',
      title: 'Mestre dos Zeramentos',
      description: 'Zerou 25 jogos na sua biblioteca.',
      icon: '👑',
      category: 'games',
      maxProgress: 25,
      xpReward: 400,
      color: 'from-amber-400 to-orange-500',
    },
    {
      id: 'plat_trophy',
      title: 'Platinador Nato',
      description: 'Conquistou 3 jogos no 100% ou Platina.',
      icon: '🏆',
      category: 'trophy',
      maxProgress: 3,
      xpReward: 150,
      color: 'from-purple-400 to-pink-500',
    },
    {
      id: 'plat_legend',
      title: 'Colecionador Obsessivo',
      description: 'Conquistou 5 Platinas ou 100% de colecionáveis.',
      icon: '💎',
      category: 'trophy',
      maxProgress: 5,
      xpReward: 300,
      color: 'from-pink-400 to-rose-500',
    },
    {
      id: 'souls_hardcore',
      title: 'Sem Medo do Perigo',
      description: 'Zerou pelo menos 2 jogos no modo Muito Difícil / Hardcore.',
      icon: '💀',
      category: 'difficulty',
      maxProgress: 2,
      xpReward: 150,
      color: 'from-rose-500 to-red-600',
    },
    {
      id: 'century_hours',
      title: 'Maratonista dos Games',
      description: 'Acumulou mais de 100 horas de gameplay zerando jogos.',
      icon: '⏳',
      category: 'time',
      maxProgress: 100,
      xpReward: 150,
      color: 'from-cyan-400 to-blue-500',
    },
    {
      id: 'masterpiece_reviewer',
      title: 'Aura de Obra-Prima',
      description: 'Premiou ao menos um jogo com a prestigiosa Nota 10.',
      icon: '🌟',
      category: 'special',
      maxProgress: 1,
      xpReward: 75,
      color: 'from-amber-300 to-yellow-500',
    },
    {
      id: 'cross_platform',
      title: 'Gamer Multiplataforma',
      description: 'Zerou jogos em pelo menos 3 consoles ou plataformas distintas.',
      icon: '🕹️',
      category: 'variety',
      maxProgress: 3,
      xpReward: 120,
      color: 'from-teal-400 to-emerald-600',
    },
    {
      id: 'genre_explorer',
      title: 'Explorador de Gêneros',
      description: 'Experimentou e zerou títulos em 4 gêneros diferentes.',
      icon: '🧭',
      category: 'variety',
      maxProgress: 4,
      xpReward: 120,
      color: 'from-blue-500 to-purple-600',
    },
    {
      id: 'retro_nostalgia',
      title: 'Guardião Retrogamer',
      description: 'Zerou ao menos um clássico retrô ou jogo lançado até 2005.',
      icon: '💾',
      category: 'special',
      maxProgress: 1,
      xpReward: 100,
      color: 'from-orange-400 to-red-500',
    },
  ];

  // Evaluate progress and unlocking
  let badgesXp = 0;
  const badges: Badge[] = badgeDefs.map((def) => {
    let current = 0;
    if (def.id === 'first_game') current = totalGames;
    else if (def.id === 'trilogy') current = totalGames;
    else if (def.id === 'ten_club') current = totalGames;
    else if (def.id === 'quarter_century') current = totalGames;
    else if (def.id === 'plat_trophy') current = platCount;
    else if (def.id === 'plat_legend') current = platCount;
    else if (def.id === 'souls_hardcore') current = hardCount;
    else if (def.id === 'century_hours') current = Math.floor(totalHours);
    else if (def.id === 'masterpiece_reviewer') current = score10Count;
    else if (def.id === 'cross_platform') current = distinctPlatforms;
    else if (def.id === 'genre_explorer') current = distinctGenres;
    else if (def.id === 'retro_nostalgia') current = retroCount;

    const unlocked = current >= def.maxProgress;
    if (unlocked) {
      badgesXp += def.xpReward;
    }

    return {
      ...def,
      currentProgress: Math.min(current, def.maxProgress),
      unlocked,
    };
  });

  const totalXp = baseGameXp + badgesXp;

  // Determine current player level
  let currentLevel = PLAYER_LEVELS[0];
  let nextLevel: PlayerLevel | null = PLAYER_LEVELS[1];

  for (let i = 0; i < PLAYER_LEVELS.length; i++) {
    const lvl = PLAYER_LEVELS[i];
    if (totalXp >= lvl.minXp) {
      currentLevel = lvl;
      nextLevel = PLAYER_LEVELS[i + 1] || null;
    }
  }

  const min = currentLevel.minXp;
  const max = nextLevel ? nextLevel.minXp : currentLevel.maxXp;
  const xpInCurrentLevel = totalXp - min;
  const xpRequiredForNext = max - min;
  const levelProgressPercent = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpRequiredForNext) * 100)));

  return {
    totalXp,
    currentLevel,
    nextLevel,
    xpInCurrentLevel,
    xpRequiredForNext,
    levelProgressPercent,
    badges,
    unlockedCount: badges.filter((b) => b.unlocked).length,
    totalBadgesCount: badges.length,
  };
}
