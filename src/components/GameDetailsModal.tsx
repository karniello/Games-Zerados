import React, { useState, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Star, 
  Trophy, 
  Gamepad2, 
  Edit3, 
  Trash2, 
  Heart, 
  Sparkles,
  Layers,
  Building,
  PenLine,
  CheckCircle2,
  Circle,
  Search,
  RefreshCw,
  Link2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  DownloadCloud,
  Check,
  Award,
  Flame,
  ClipboardPaste,
  ShieldAlert,
  Info,
  Copy,
  Quote
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Game, GameAchievement, TrophyType } from '../types.ts';
import { fetchGameAchievements, syncExternalAchievements, generateAchievementSummary } from '../services/api.ts';

interface GameDetailsModalProps {
  game: Game | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (game: Game) => void;
  onDelete: (id: string, game?: Game) => void;
  onUpdateGame?: (game: Game) => void;
}

type FilterStatus = 'all' | 'unlocked' | 'locked';

export const GameDetailsModal: React.FC<GameDetailsModalProps> = ({
  game,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onUpdateGame,
}) => {
  if (!isOpen || !game) return null;

  // Local states for achievements and search/sync
  const [activeTab, setActiveTab] = useState<'details' | 'achievements'>('details');
  const [achievementSearch, setAchievementSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterTier, setFilterTier] = useState<TrophyType | 'all'>('all');
  const [isFetchingAchievements, setIsFetchingAchievements] = useState(false);
  const [fetchFeedback, setFetchFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // External tracker sync state
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [trackerMode, setTrackerMode] = useState<'steam' | 'web' | 'paste'>('steam');
  const [trackerInput, setTrackerInput] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [isSyncingTracker, setIsSyncingTracker] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Motivational Achievement Summary (Gemini) states
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryFeedback, setSummaryFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const achievements = game.achievements || [];
  const totalCount = achievements.length;
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const progressPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;
  const is100Percent = totalCount > 0 && unlockedCount === totalCount;

  // Counts by trophy type
  const trophyCounts = useMemo(() => {
    const counts = {
      platinum: { total: 0, unlocked: 0 },
      gold: { total: 0, unlocked: 0 },
      silver: { total: 0, unlocked: 0 },
      bronze: { total: 0, unlocked: 0 },
      special: { total: 0, unlocked: 0 },
    };
    achievements.forEach((a) => {
      const type = a.type || 'bronze';
      if (counts[type]) {
        counts[type].total++;
        if (a.unlocked) counts[type].unlocked++;
      }
    });
    return counts;
  }, [achievements]);

  // Toggle single achievement
  const handleToggleAchievement = (achId: string) => {
    const now = new Date().toISOString();
    const updated = achievements.map((a) => {
      if (a.id === achId) {
        const nextUnlocked = !a.unlocked;
        return {
          ...a,
          unlocked: nextUnlocked,
          unlockedAt: nextUnlocked ? now : undefined,
        };
      }
      return a;
    });

    // Check if this newly unlocked all achievements
    const newlyUnlockedCount = updated.filter((a) => a.unlocked).length;
    if (newlyUnlockedCount === updated.length && updated.length > 0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    if (onUpdateGame) {
      onUpdateGame({
        ...game,
        achievements: updated,
      });
    }
  };

  // Batch toggle: Mark all as unlocked or locked
  const handleBatchToggle = (setUnlocked: boolean) => {
    const now = new Date().toISOString();
    const updated = achievements.map((a) => ({
      ...a,
      unlocked: setUnlocked,
      unlockedAt: setUnlocked ? (a.unlockedAt || now) : undefined,
    }));

    if (setUnlocked && updated.length > 0) {
      confetti({
        particleCount: 90,
        spread: 60,
        origin: { y: 0.6 },
      });
    }

    if (onUpdateGame) {
      onUpdateGame({
        ...game,
        achievements: updated,
      });
    }
  };

  // Fetch official achievements automatically from RAWG / Gemini / Curated
  const handleFetchOnlineAchievements = async () => {
    setIsFetchingAchievements(true);
    setFetchFeedback(null);
    try {
      const fetched = await fetchGameAchievements(game.title, game.platform);
      if (fetched.length === 0) {
        setFetchFeedback({
          type: 'info',
          text: `Nenhuma conquista catalogada encontrada para "${game.title}". Você pode cadastrar ou colar manualmente.`,
        });
        return;
      }

      // Smart merge: retain any already unlocked achievements if titles match
      const merged = fetched.map((fItem) => {
        const existing = achievements.find(
          (a) => a.title.toLowerCase() === fItem.title.toLowerCase()
        );
        if (existing && existing.unlocked) {
          return {
            ...fItem,
            unlocked: true,
            unlockedAt: existing.unlockedAt,
          };
        }
        return fItem;
      });

      if (onUpdateGame) {
        onUpdateGame({
          ...game,
          achievements: merged,
        });
      }

      setFetchFeedback({
        type: 'success',
        text: `🎉 ${merged.length} conquistas carregadas com sucesso para ${game.title}!`,
      });
    } catch (err: any) {
      setFetchFeedback({
        type: 'error',
        text: 'Não foi possível buscar as conquistas no momento. Tente novamente em instantes.',
      });
    } finally {
      setIsFetchingAchievements(false);
    }
  };

  // Sync with external tracking site (Steam, Exophase, RetroAchievements, or paste)
  const handleSyncTracker = async () => {
    if (achievements.length === 0) {
      setSyncFeedback({
        type: 'error',
        text: 'Busque primeiro as conquistas do jogo acima para poder sincronizar com seu perfil.',
      });
      return;
    }

    setIsSyncingTracker(true);
    setSyncFeedback(null);

    try {
      const res = await syncExternalAchievements({
        gameTitle: game.title,
        trackerType: trackerMode,
        profileUrlOrId: trackerInput.trim(),
        pastedText: trackerMode === 'paste' ? pastedText : undefined,
        currentAchievements: achievements,
      });

      if (res.unlockedCount > 0) {
        if (onUpdateGame) {
          onUpdateGame({
            ...game,
            achievements: res.achievements,
          });
        }
        setSyncFeedback({
          type: 'success',
          text: res.message,
        });
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } else {
        setSyncFeedback({
          type: 'error',
          text: res.message || 'Nenhuma conquista correspondente foi identificada.',
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        text: err.message || 'Erro ao sincronizar com rastreador externo.',
      });
    } finally {
      setIsSyncingTracker(false);
    }
  };

  // Generate motivational achievement summary via Gemini
  const handleGenerateAchievementSummary = async () => {
    setIsGeneratingSummary(true);
    setSummaryFeedback(null);
    try {
      const summaryResult = await generateAchievementSummary({
        gameTitle: game.title,
        platform: game.platform,
        hours: game.hours,
        rating: game.rating,
        difficulty: game.difficulty,
        completionCondition: game.completionCondition,
        totalAchievements: totalCount,
        unlockedAchievements: unlockedCount,
        achievementsList: achievements.map((a) => ({
          title: a.title,
          unlocked: a.unlocked,
          type: a.type,
        })),
      });

      if (onUpdateGame) {
        onUpdateGame({
          ...game,
          achievementSummary: summaryResult,
        });
      }

      setSummaryFeedback({
        type: 'success',
        text: 'Resumo de conquistas gerado com sucesso pelo Gemini!',
      });

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setSummaryFeedback({
        type: 'error',
        text: err.message || 'Falha ao gerar resumo motivacional. Tente novamente.',
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Copy summary to clipboard
  const handleCopySummary = (text: string, title?: string) => {
    const full = `${title ? `${title}\n\n` : ''}"${text}"\n\n— GameVault (Resumo de Conquistas)`;
    navigator.clipboard.writeText(full);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Filtered achievements
  const filteredAchievements = useMemo(() => {
    return achievements.filter((a) => {
      if (filterStatus === 'unlocked' && !a.unlocked) return false;
      if (filterStatus === 'locked' && a.unlocked) return false;
      if (filterTier !== 'all' && a.type !== filterTier) return false;
      if (achievementSearch.trim()) {
        const query = achievementSearch.toLowerCase();
        return (
          a.title.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [achievements, filterStatus, filterTier, achievementSearch]);

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Muito Fácil': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Fácil': return 'text-teal-400 bg-teal-500/10 border-teal-500/30';
      case 'Normal': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'Difícil': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Muito Difícil': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default: return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    }
  };

  const getTrophyColor = (type: TrophyType) => {
    switch (type) {
      case 'platinum':
        return {
          icon: 'text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]',
          badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
          label: 'Platina',
        };
      case 'gold':
        return {
          icon: 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]',
          badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          label: 'Ouro',
        };
      case 'silver':
        return {
          icon: 'text-slate-300',
          badge: 'bg-slate-400/15 text-slate-200 border-slate-400/30',
          label: 'Prata',
        };
      case 'bronze':
        return {
          icon: 'text-amber-600',
          badge: 'bg-amber-700/15 text-amber-500 border-amber-700/30',
          label: 'Bronze',
        };
      default:
        return {
          icon: 'text-purple-400',
          badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          label: 'Especial',
        };
    }
  };

  const formattedDate = new Date(game.completedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        
        {/* Background Ambient Banner */}
        <div className="relative h-44 sm:h-52 overflow-hidden bg-zinc-950 flex-shrink-0">
          <img
            src={game.thumbnail}
            alt={game.title}
            className="w-full h-full object-cover blur-md opacity-35 scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/80 transition-colors cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Poster and Title Header */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end gap-3.5 sm:gap-4">
            <img
              src={game.thumbnail}
              alt={game.title}
              className="w-20 sm:w-26 h-28 sm:h-36 rounded-2xl object-cover shadow-2xl ring-2 ring-white/20 bg-zinc-800 flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80';
              }}
            />
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[11px] font-bold">
                  {game.platform}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[11px] font-medium">
                  {game.genre}
                </span>
                {game.favorite && (
                  <span className="p-1 rounded-full bg-rose-500/20 text-rose-400">
                    <Heart className="w-3.5 h-3.5 fill-rose-400" />
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white leading-tight truncate">
                {game.title}
              </h2>
              {game.releaseYear && (
                <p className="text-xs text-zinc-400">
                  Lançado em {game.releaseYear} {game.developer ? `• ${game.developer}` : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs Header */}
        <div className="flex items-center gap-2 px-5 sm:px-6 pt-3 pb-1 border-b border-zinc-800 bg-zinc-900 flex-shrink-0">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer border ${
              activeTab === 'details'
                ? 'bg-zinc-800 text-white border-zinc-700 shadow-sm'
                : 'text-zinc-400 hover:text-white border-transparent hover:bg-zinc-800/50'
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-indigo-400" />
            <span>Ficha & Estatísticas</span>
          </button>

          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer border relative ${
              activeTab === 'achievements'
                ? 'bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white border-transparent hover:bg-zinc-800/50'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Conquistas & Troféus</span>
            {totalCount > 0 ? (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                is100Percent ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
              }`}>
                {unlockedCount}/{totalCount}
              </span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {activeTab === 'details' ? (
            /* TAB 1: General Game Details & Stats */
            <div className="space-y-6">
              
              {/* Key Stat Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Score */}
                <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1 mb-0.5">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Nota
                  </span>
                  <span className="text-xl font-black text-amber-400">
                    {game.rating.toFixed(1)} <span className="text-xs text-zinc-500 font-normal">/ 10</span>
                  </span>
                </div>

                {/* Dificuldade */}
                <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] text-zinc-400 mb-0.5">Dificuldade</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${getDifficultyBadge(game.difficulty)}`}>
                    {game.difficulty}
                  </span>
                </div>

                {/* Horas */}
                <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1 mb-0.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" /> Tempo
                  </span>
                  <span className="text-lg font-black text-zinc-100">
                    {game.hours} <span className="text-xs text-zinc-400 font-normal">horas</span>
                  </span>
                </div>

                {/* Condição */}
                <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1 mb-0.5">
                    <Trophy className="w-3.5 h-3.5 text-purple-400" /> Condição
                  </span>
                  <span className="text-[11px] font-bold text-purple-300 text-center leading-tight truncate max-w-full">
                    {game.completionCondition}
                  </span>
                </div>
              </div>

              {/* Achievements Quick Summary Card */}
              <div 
                onClick={() => setActiveTab('achievements')}
                className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-950 to-purple-500/10 border border-amber-500/30 flex items-center justify-between cursor-pointer hover:border-amber-500/60 transition-all group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 group-hover:scale-105 transition-transform">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Progresso de Conquistas</span>
                      {is100Percent && <Award className="w-4 h-4 text-amber-400" />}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {totalCount > 0 
                        ? `${unlockedCount} de ${totalCount} desbloqueadas (${progressPercent}%)` 
                        : 'Nenhuma lista vinculada. Clique para buscar automaticamente via RAWG ou IA.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400 group-hover:underline flex items-center gap-1">
                    Ver lista <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                  </span>
                </div>
              </div>

              {/* Resumo de Conquistas (Gemini AI Motivational Summary) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/30 via-zinc-950 to-purple-950/25 border border-indigo-500/30 space-y-3 relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 shadow-inner">
                      <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <span>Resumo de Conquistas</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold normal-case">
                          Gemini IA
                        </span>
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        Texto motivacional personalizado baseado nas suas conquistas e superações
                      </p>
                    </div>
                  </div>

                  {game.achievementSummary && (
                    <div className="flex items-center gap-1.5">
                      {game.achievementSummary.tone && (
                        <span className="px-2 py-0.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-bold">
                          {game.achievementSummary.tone}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCopySummary(game.achievementSummary!.text, game.achievementSummary!.title)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer text-xs"
                        title="Copiar resumo motivacional"
                      >
                        {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Content body */}
                {game.achievementSummary ? (
                  <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-2 relative">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                      <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>{game.achievementSummary.title || `Conquistador de ${game.title}`}</span>
                    </div>

                    <div className="flex gap-2">
                      <Quote className="w-4 h-4 text-indigo-400/60 rotate-180 flex-shrink-0 mt-0.5" />
                      <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed italic">
                        "{game.achievementSummary.text}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-500">
                      <span>
                        Gerado em {new Date(game.achievementSummary.generatedAt).toLocaleDateString('pt-BR')}
                      </span>
                      <button
                        type="button"
                        onClick={handleGenerateAchievementSummary}
                        disabled={isGeneratingSummary}
                        className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-50"
                      >
                        {isGeneratingSummary ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Regenerando...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            <span>Regenerar com Gemini</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-zinc-950/60 border border-dashed border-zinc-800 text-center space-y-2.5">
                    <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                      Deixe a inteligência artificial do Gemini analisar suas horas jogadas, troféus e nota para criar um texto motivacional exclusivo celebrando sua façanha.
                    </p>
                    <button
                      type="button"
                      onClick={handleGenerateAchievementSummary}
                      disabled={isGeneratingSummary}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer inline-flex items-center gap-2 disabled:opacity-50"
                    >
                      {isGeneratingSummary ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Consultando Gemini...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Gerar Resumo de Conquistas ✨</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {summaryFeedback && (
                  <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                    summaryFeedback.type === 'success'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  }`}>
                    <Info className="w-4 h-4 flex-shrink-0" />
                    <span>{summaryFeedback.text}</span>
                  </div>
                )}
              </div>

              {/* Completion Date */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/80 text-xs text-zinc-300">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Zerado e registrado em: <strong className="text-white font-semibold">{formattedDate}</strong></span>
              </div>

              {/* Synopsis */}
              {game.synopsis && (
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Sinopse do Jogo
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/60">
                    {game.synopsis}
                  </p>
                </div>
              )}

              {/* Personal Review / Notes */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/20 via-zinc-950 to-zinc-950 border border-purple-500/25 space-y-2">
                <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                  <PenLine className="w-3.5 h-3.5 text-purple-400" />
                  <span>Sua Análise Pessoal & Memórias</span>
                </h4>
                {game.notes ? (
                  <div className="text-xs sm:text-sm text-zinc-200 leading-relaxed bg-zinc-950/60 border border-purple-500/20 p-3.5 rounded-xl whitespace-pre-wrap font-normal">
                    "{game.notes}"
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/40 border border-zinc-800 text-xs text-zinc-500 italic">
                    <span>Nenhuma anotação ou review pessoal registrada ainda.</span>
                    <button
                      type="button"
                      onClick={() => onEdit(game)}
                      className="not-italic text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer ml-2 flex-shrink-0"
                    >
                      Adicionar review
                    </button>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* TAB 2: Achievements Checklist & Tracker Sync */
            <div className="space-y-5">
              
              {/* Progress Banner */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>Progresso de Conquistas do Jogo</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {totalCount > 0 ? (
                        <span>
                          Você completou <strong className="text-amber-400">{unlockedCount}</strong> de <strong className="text-white">{totalCount}</strong> conquistas ({progressPercent}%)
                        </span>
                      ) : (
                        <span>Nenhuma conquista carregada para este jogo ainda.</span>
                      )}
                    </p>
                  </div>

                  {totalCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      {is100Percent ? (
                        <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black flex items-center gap-1 shadow-sm animate-pulse">
                          <Award className="w-4 h-4" /> 100% Platinado! 🎉
                        </span>
                      ) : (
                        <span className="text-xl font-black text-amber-400">
                          {progressPercent}%
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {totalCount > 0 && (
                  <div className="space-y-1.5">
                    <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 via-amber-500 to-amber-400 transition-all duration-500 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    {/* Trophy Rarity Breakdown Badges */}
                    <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px]">
                      {trophyCounts.platinum.total > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold flex items-center gap-1">
                          💎 Platina: {trophyCounts.platinum.unlocked}/{trophyCounts.platinum.total}
                        </span>
                      )}
                      {trophyCounts.gold.total > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold flex items-center gap-1">
                          🥇 Ouro: {trophyCounts.gold.unlocked}/{trophyCounts.gold.total}
                        </span>
                      )}
                      {trophyCounts.silver.total > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-400/10 border border-slate-400/30 text-slate-200 font-semibold flex items-center gap-1">
                          🥈 Prata: {trophyCounts.silver.unlocked}/{trophyCounts.silver.total}
                        </span>
                      )}
                      {trophyCounts.bronze.total > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-800/10 border border-amber-700/30 text-amber-400 font-semibold flex items-center gap-1">
                          🥉 Bronze: {trophyCounts.bronze.unlocked}/{trophyCounts.bronze.total}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Motivational Achievement Summary Banner in Tab 2 */}
              {game.achievementSummary && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-in fade-in duration-200">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mt-0.5 flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-amber-300 truncate flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          <span>{game.achievementSummary.title || 'Resumo de Conquistas'}</span>
                        </span>
                        {game.achievementSummary.tone && (
                          <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[10px] font-semibold border border-purple-500/30">
                            {game.achievementSummary.tone}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-300 italic mt-1 leading-snug">
                        "{game.achievementSummary.text}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopySummary(game.achievementSummary!.text, game.achievementSummary!.title)}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                      title="Copiar resumo"
                    >
                      {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">Copiar</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateAchievementSummary}
                      disabled={isGeneratingSummary}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                      title="Regenerar resumo com Gemini"
                    >
                      {isGeneratingSummary ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden sm:inline">Regenerar IA</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Toolbar: Fetch Online, Summary with Gemini & Sync Tracker */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Online Fetch Button */}
                  <button
                    type="button"
                    onClick={handleFetchOnlineAchievements}
                    disabled={isFetchingAchievements}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    {isFetchingAchievements ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Buscando Troféus...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>{totalCount > 0 ? 'Atualizar Troféus' : 'Buscar Conquistas Automaticamente'}</span>
                      </>
                    )}
                  </button>

                  {/* Gemini Summary Button */}
                  <button
                    type="button"
                    onClick={handleGenerateAchievementSummary}
                    disabled={isGeneratingSummary}
                    className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    {isGeneratingSummary ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Gerando Resumo...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-200" />
                        <span>{game.achievementSummary ? 'Resumo de Conquistas (Gemini)' : 'Gerar Resumo IA'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* External Tracker Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsTrackerOpen(!isTrackerOpen)}
                  className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isTrackerOpen
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200'
                  }`}
                >
                  <Link2 className="w-4 h-4 text-amber-400" />
                  <span>Vincular Rastreador</span>
                  {isTrackerOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

              </div>

              {/* Fetch Online Feedback Message */}
              {fetchFeedback && (
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  fetchFeedback.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : fetchFeedback.type === 'error'
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                    : 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                }`}>
                  <Info className="w-4 h-4 flex-shrink-0" />
                  <span>{fetchFeedback.text}</span>
                </div>
              )}

              {/* External Tracker Sync Drawer */}
              {isTrackerOpen && (
                <div className="p-4 rounded-2xl bg-zinc-950/90 border border-amber-500/30 space-y-3.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-amber-400" />
                      <span>Sincronização com Sites de Conquistas</span>
                    </h4>
                    <span className="text-[11px] text-zinc-500">
                      Steam • Exophase • PSNProfiles • RetroAchievements
                    </span>
                  </div>

                  {/* Mode selector pills */}
                  <div className="flex items-center gap-1.5 p-1 bg-zinc-900 rounded-xl border border-zinc-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setTrackerMode('steam')}
                      className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                        trackerMode === 'steam'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Steam Community
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrackerMode('web')}
                      className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                        trackerMode === 'web'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Exophase / Link Web
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrackerMode('paste')}
                      className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                        trackerMode === 'paste'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Colar do Rastreador
                    </button>
                  </div>

                  {/* Mode 1: Steam */}
                  {trackerMode === 'steam' && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-zinc-300">
                        Link do seu Perfil Público Steam ou Steam ID:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={trackerInput}
                          onChange={(e) => setTrackerInput(e.target.value)}
                          placeholder="Ex: https://steamcommunity.com/id/seunick ou seunick"
                          className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={handleSyncTracker}
                          disabled={isSyncingTracker || !trackerInput.trim()}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0 flex items-center gap-1.5"
                        >
                          {isSyncingTracker ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <DownloadCloud className="w-3.5 h-3.5" />
                          )}
                          <span>Sincronizar</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-500">
                        * O perfil e os detalhes dos jogos devem estar configurados como "Público" na Steam.
                      </p>
                    </div>
                  )}

                  {/* Mode 2: Web Link (Exophase / RetroAchievements / PSNProfiles) */}
                  {trackerMode === 'web' && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-zinc-300">
                        URL pública da sua página de troféus (Exophase, PSNProfiles ou RetroAchievements):
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={trackerInput}
                          onChange={(e) => setTrackerInput(e.target.value)}
                          placeholder="Ex: https://www.exophase.com/user/seunome/ ou https://retroachievements.org/user/..."
                          className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={handleSyncTracker}
                          disabled={isSyncingTracker || !trackerInput.trim()}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0 flex items-center gap-1.5"
                        >
                          {isSyncingTracker ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <DownloadCloud className="w-3.5 h-3.5" />
                          )}
                          <span>Sincronizar</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Mode 3: Paste text from any tracker */}
                  {trackerMode === 'paste' && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-zinc-300">
                        Copie e cole a lista de conquistas desbloqueadas de qualquer site ou aplicativo:
                      </label>
                      <textarea
                        rows={3}
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        placeholder="Cole aqui o texto copiado do Exophase, Steam, PlayStation App, Xbox ou TrueAchievements..."
                        className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none font-mono"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleSyncTracker}
                          disabled={isSyncingTracker || !pastedText.trim()}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                        >
                          {isSyncingTracker ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ClipboardPaste className="w-3.5 h-3.5" />
                          )}
                          <span>Identificar e Marcar Conquistas</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Feedback Message */}
                  {syncFeedback && (
                    <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                      syncFeedback.type === 'success'
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                    }`}>
                      <Info className="w-4 h-4 flex-shrink-0" />
                      <span>{syncFeedback.text}</span>
                    </div>
                  )}

                </div>
              )}

              {/* Achievements Checklist View */}
              {totalCount > 0 ? (
                <div className="space-y-3">
                  
                  {/* Search and Filter Controls */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                    
                    {/* Search box */}
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        value={achievementSearch}
                        onChange={(e) => setAchievementSearch(e.target.value)}
                        placeholder="Filtrar por nome ou descrição..."
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setFilterStatus('all')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          filterStatus === 'all'
                            ? 'bg-zinc-800 text-white'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Todas ({totalCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterStatus('unlocked')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          filterStatus === 'unlocked'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Concluídas ({unlockedCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterStatus('locked')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          filterStatus === 'locked'
                            ? 'bg-zinc-800 text-zinc-300'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Pendentes ({totalCount - unlockedCount})
                      </button>
                    </div>

                    {/* Quick batch buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleBatchToggle(true)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-[11px] font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        title="Marcar todas como concluídas"
                      >
                        Marcar 100%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBatchToggle(false)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-[11px] font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title="Desmarcar todas"
                      >
                        Limpar
                      </button>
                    </div>

                  </div>

                  {/* Checklist Items Container */}
                  <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
                    {filteredAchievements.map((ach) => {
                      const trophyMeta = getTrophyColor(ach.type || 'bronze');
                      return (
                        <div
                          key={ach.id}
                          onClick={() => handleToggleAchievement(ach.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                            ach.unlocked
                              ? 'bg-zinc-950/90 border-emerald-500/30 shadow-sm shadow-emerald-500/5'
                              : 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700 opacity-80 hover:opacity-100'
                          }`}
                        >
                          {/* Custom Checkbox */}
                          <div className="mt-0.5 flex-shrink-0">
                            {ach.unlocked ? (
                              <div className="w-5 h-5 rounded-lg bg-emerald-500 text-zinc-950 flex items-center justify-center shadow-md shadow-emerald-500/20">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-lg border-2 border-zinc-700 hover:border-indigo-500 transition-colors bg-zinc-900" />
                            )}
                          </div>

                          {/* Trophy Icon */}
                          <div className={`mt-0.5 flex-shrink-0 ${trophyMeta.icon}`}>
                            <Trophy className="w-4 h-4" />
                          </div>

                          {/* Title & Description */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <span className={`text-xs font-bold leading-tight ${
                                ach.unlocked ? 'text-zinc-100' : 'text-zinc-300'
                              }`}>
                                {ach.title}
                              </span>

                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${trophyMeta.badge}`}>
                                {trophyMeta.label}
                              </span>

                              {ach.unlocked && (
                                <span className="text-[10px] text-emerald-400 font-medium">
                                  ✓ Desbloqueada
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-zinc-400 leading-snug">
                              {ach.description}
                            </p>

                            {ach.unlocked && ach.unlockedAt && (
                              <p className="text-[10px] text-zinc-500 mt-1">
                                Concluída em {new Date(ach.unlockedAt).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {filteredAchievements.length === 0 && (
                      <div className="p-8 text-center bg-zinc-950/40 rounded-2xl border border-zinc-800/60">
                        <p className="text-xs text-zinc-400">
                          Nenhuma conquista encontrada com os filtros selecionados.
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                /* Empty State */
                <div className="p-8 text-center bg-zinc-950/60 rounded-3xl border border-zinc-800/80 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Nenhuma lista de conquistas vinculada ainda
                    </h4>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1 leading-relaxed">
                      Busque automaticamente a lista de troféus oficiais do jogo através de nossa base com RAWG e IA, ou vincule com seu perfil Steam/Exophase para marcar o que você já zerou.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleFetchOnlineAchievements}
                      disabled={isFetchingAchievements}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/30 cursor-pointer flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Buscar Conquistas de {game.title}</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/90 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => {
              onDelete(game.id, game);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir Jogo</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(game);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Editar Jogo</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
