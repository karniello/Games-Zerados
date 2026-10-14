import React, { useState } from 'react';
import { 
  X, 
  Award, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  Trophy, 
  Flame, 
  Star,
  Zap,
  Filter
} from 'lucide-react';
import { Badge, GamificationState } from '../services/gamification';

interface BadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  gamification: GamificationState;
}

export const BadgesModal: React.FC<BadgesModalProps> = ({
  isOpen,
  onClose,
  gamification,
}) => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  if (!isOpen) return null;

  const { badges, currentLevel, nextLevel, totalXp, unlockedCount, totalBadgesCount } = gamification;

  const filteredBadges = badges.filter((b) => {
    if (filter === 'unlocked') return b.unlocked;
    if (filter === 'locked') return !b.unlocked;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span>Galeria de Conquistas & Emblemas</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black">
                  {unlockedCount} / {totalBadgesCount}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Ganhe XP e desbloqueie novos títulos subindo de nível como gamer
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level Stats Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-950/30 via-zinc-900 to-indigo-950/30 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{currentLevel.badgeIcon}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-purple-400">
                  Nível {currentLevel.level}
                </span>
                <span className="text-xs font-bold text-white">
                  • {currentLevel.title}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Total acumulado: <strong className="text-amber-400">{totalXp} XP</strong>
                {nextLevel ? ` (Próximo nível com ${nextLevel.minXp} XP)` : ' • Nível Máximo!'}
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-bold self-start sm:self-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todos ({totalBadgesCount})
            </button>
            <button
              onClick={() => setFilter('unlocked')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'unlocked'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Desbloqueados ({unlockedCount})
            </button>
            <button
              onClick={() => setFilter('locked')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'locked'
                  ? 'bg-zinc-800 text-zinc-300'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              A Conquistar ({totalBadgesCount - unlockedCount})
            </button>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredBadges.map((badge) => {
              const progressPct = Math.round((badge.currentProgress / badge.maxProgress) * 100);

              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    badge.unlocked
                      ? 'bg-gradient-to-br from-zinc-900 to-zinc-950 border-amber-500/30 shadow-lg shadow-amber-500/5 hover:border-amber-400/60'
                      : 'bg-zinc-950/60 border-zinc-800/80 opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Badge Icon Medal */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-inner ${
                        badge.unlocked
                          ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 ring-1 ring-amber-400/30 shadow-lg shadow-amber-500/10'
                          : 'bg-zinc-800/80 border border-zinc-700 text-zinc-500 grayscale'
                      }`}
                    >
                      {badge.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-white truncate">
                          {badge.title}
                        </h4>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25 flex-shrink-0">
                          +{badge.xpReward} XP
                        </span>
                      </div>

                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        {badge.description}
                      </p>
                    </div>
                  </div>

                  {/* Footer status / progress bar */}
                  <div className="mt-3.5 pt-3 border-t border-zinc-800/80">
                    {badge.unlocked ? (
                      <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300">Conquista Desbloqueada!</span>
                        </span>
                        <span className="text-[10px] text-zinc-500">Completado</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Lock className="w-3 h-3 text-zinc-500" /> Progresso
                          </span>
                          <span className="font-bold text-zinc-300">
                            {badge.currentProgress} / {badge.maxProgress} ({progressPct}%)
                          </span>
                        </div>
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/70 flex items-center justify-between">
          <span className="text-xs text-zinc-400">
            Cadastre novos jogos zerados, conquiste platinas e aumente seu nível de gamer!
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
