import React from 'react';
import { 
  Trophy, 
  Sparkles, 
  Award, 
  Zap, 
  ChevronRight, 
  Shield, 
  Flame, 
  Star
} from 'lucide-react';
import { UserProfile } from '../types';
import { GamificationState } from '../services/gamification';

interface GamerProfileBannerProps {
  currentUser: UserProfile;
  gamification: GamificationState;
  onOpenBadgesModal: () => void;
  onOpenProfile?: () => void;
}

export const GamerProfileBanner: React.FC<GamerProfileBannerProps> = ({
  currentUser,
  gamification,
  onOpenBadgesModal,
  onOpenProfile,
}) => {
  const { 
    totalXp, 
    currentLevel, 
    nextLevel, 
    xpInCurrentLevel, 
    xpRequiredForNext, 
    levelProgressPercent, 
    badges, 
    unlockedCount, 
    totalBadgesCount 
  } = gamification;

  const unlockedBadges = badges.filter((b) => b.unlocked);

  return (
    <div className="bg-gradient-to-r from-zinc-900 via-indigo-950/30 to-purple-950/40 border border-zinc-800 hover:border-indigo-500/40 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden transition-all">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/10 rounded-full blur-[90px] pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Left Side: Avatar, Name & Level Info */}
        <div className="flex items-center gap-4">
          
          {/* Avatar with Level Ring */}
          <div 
            onClick={onOpenProfile || onOpenBadgesModal}
            className="relative cursor-pointer hover:scale-105 transition-transform"
            title="Abrir Área do Usuário & Perfil"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-zinc-800 ring-2 ring-purple-500/40 shadow-xl shadow-purple-500/15"
            />
            {/* Level Badge Pill */}
            <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black font-black text-[11px] shadow-lg flex items-center gap-0.5 ring-2 ring-zinc-900">
              <span>{currentLevel.badgeIcon}</span>
              <span>Nv.{currentLevel.level}</span>
            </div>
          </div>

          {/* User Details */}
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                {currentUser.name}
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                {currentUser.gamerTag}
              </span>
            </div>

            <p className="text-xs sm:text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 flex items-center gap-1.5">
              <span>{currentLevel.badgeIcon}</span>
              <span>{currentLevel.title}</span>
            </p>

            <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1.5">
              <span className="flex items-center gap-1 font-semibold text-amber-300">
                <Zap className="w-3.5 h-3.5 fill-amber-300" />
                {totalXp} XP Total
              </span>
              <span>•</span>
              <span className="text-zinc-300">
                {unlockedCount} de {totalBadgesCount} Conquistas
              </span>
            </div>
          </div>

        </div>

        {/* Center: XP Progress Bar towards Next Level */}
        <div className="flex-1 max-w-md space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-zinc-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Progresso para Nível {nextLevel ? nextLevel.level : currentLevel.level}</span>
            </span>
            <span className="text-purple-400">
              {nextLevel ? `${xpInCurrentLevel} / ${xpRequiredForNext} XP (${levelProgressPercent}%)` : 'NÍVEL MÁXIMO'}
            </span>
          </div>

          <div className="h-3 w-full bg-zinc-950 rounded-full p-0.5 border border-zinc-800 overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-700 shadow-md shadow-purple-500/30"
              style={{ width: `${nextLevel ? Math.max(levelProgressPercent, 5) : 100}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>Nível {currentLevel.level} ({currentLevel.minXp} XP)</span>
            <span>{nextLevel ? `Nível ${nextLevel.level} (${nextLevel.minXp} XP)` : 'Lenda dos Games'}</span>
          </div>
        </div>

        {/* Right Side: Showcase of Unlocked Badges & Button */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-800">
          
          {/* Badge Medals Showcase */}
          <div className="flex items-center gap-1.5">
            {unlockedBadges.slice(0, 5).map((badge) => (
              <div
                key={badge.id}
                onClick={onOpenBadgesModal}
                className="w-8 h-8 rounded-xl bg-zinc-950 border border-amber-500/40 hover:border-amber-400 flex items-center justify-center text-sm shadow-sm cursor-pointer hover:scale-110 transition-transform"
                title={`${badge.title}: ${badge.description}`}
              >
                {badge.icon}
              </div>
            ))}

            {unlockedBadges.length > 5 && (
              <div
                onClick={onOpenBadgesModal}
                className="w-8 h-8 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-[11px] font-black text-purple-300 cursor-pointer hover:scale-105 transition-transform"
              >
                +{unlockedBadges.length - 5}
              </div>
            )}
          </div>

          {/* Button to open all badges modal */}
          <button
            onClick={onOpenBadgesModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white text-xs font-bold border border-zinc-700 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Ver Todas as Conquistas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

        </div>

      </div>

    </div>
  );
};
