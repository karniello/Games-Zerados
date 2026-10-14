import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Trophy, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Sparkles, 
  Flame, 
  Edit3, 
  Plus, 
  Trash2, 
  Check, 
  ArrowRight,
  TrendingUp,
  BookmarkCheck,
  Gamepad2,
  ChevronRight,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Game, YearlyGoal, BacklogItem, UserProfile } from '../types';
import { getYearlyGoal, saveYearlyGoal } from '../services/storage';

interface GoalsViewProps {
  games: Game[];
  currentUser: UserProfile;
  onOpenAddModalWithTitle?: (title: string, platform?: string) => void;
  onSelectGame: (game: Game) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  games,
  currentUser,
  onOpenAddModalWithTitle,
  onSelectGame,
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [goal, setGoal] = useState<YearlyGoal>(() => getYearlyGoal(currentUser.id, currentYear));
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempTarget, setTempTarget] = useState<number>(goal.targetGames);
  const [tempHours, setTempHours] = useState<number>(goal.targetHours || 150);

  // New backlog item state
  const [newBacklogTitle, setNewBacklogTitle] = useState('');
  const [newBacklogPlatform, setNewBacklogPlatform] = useState('PlayStation 5');

  // Load goal on year or user change
  useEffect(() => {
    const loaded = getYearlyGoal(currentUser.id, selectedYear);
    setGoal(loaded);
    setTempTarget(loaded.targetGames);
    setTempHours(loaded.targetHours || 150);
  }, [selectedYear, currentUser.id]);

  // Filter games completed in the selected year
  const completedInYear = games.filter((g) => {
    if (!g.completedDate) return false;
    return g.completedDate.startsWith(selectedYear.toString());
  });

  const completedCount = completedInYear.length;
  const targetCount = Math.max(1, goal.targetGames);
  const progressPercent = Math.min(100, Math.round((completedCount / targetCount) * 100));
  const remainingCount = Math.max(0, targetCount - completedCount);
  const totalHoursInYear = completedInYear.reduce((s, g) => s + (g.hours || 0), 0);

  // Calculate days and months remaining in the year
  const now = new Date();
  const endOfYear = new Date(selectedYear, 11, 31);
  const diffTime = endOfYear.getTime() - now.getTime();
  const daysRemaining = selectedYear === currentYear ? Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24))) : 0;
  const monthsRemaining = selectedYear === currentYear ? Math.max(1, 12 - now.getMonth()) : 12;
  const paceNeeded = remainingCount > 0 ? (remainingCount / monthsRemaining).toFixed(1) : '0';

  const handleSaveGoalSettings = () => {
    const updated: YearlyGoal = {
      ...goal,
      targetGames: Math.max(1, tempTarget),
      targetHours: Math.max(0, tempHours),
    };
    setGoal(updated);
    saveYearlyGoal(currentUser.id, updated);
    setIsEditingGoal(false);

    if (completedCount >= updated.targetGames) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  const handleAddBacklogItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBacklogTitle.trim()) return;

    const newItem: BacklogItem = {
      id: 'backlog_' + Date.now(),
      title: newBacklogTitle.trim(),
      platform: newBacklogPlatform,
      thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
      addedAt: new Date().toISOString(),
    };

    const currentBacklog = goal.backlog || [];
    const updated: YearlyGoal = {
      ...goal,
      backlog: [...currentBacklog, newItem],
    };

    setGoal(updated);
    saveYearlyGoal(currentUser.id, updated);
    setNewBacklogTitle('');
  };

  const handleRemoveBacklogItem = (id: string) => {
    const updated: YearlyGoal = {
      ...goal,
      backlog: (goal.backlog || []).filter((item) => item.id !== id),
    };
    setGoal(updated);
    saveYearlyGoal(currentUser.id, updated);
  };

  const handleMarkAsDone = (item: BacklogItem) => {
    // Remove from backlog and open registration modal
    handleRemoveBacklogItem(item.id);
    if (onOpenAddModalWithTitle) {
      onOpenAddModalWithTitle(item.title, item.platform);
    }
  };

  const isGoalAchieved = completedCount >= targetCount;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header & Year Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-pink-400" />
            <span>Metas de Zeramento Anual</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Defina sua meta de jogos zerados para o ano e acompanhe seu progresso rumo ao objetivo
          </p>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-1.5 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 self-start sm:self-auto">
          {[currentYear - 1, currentYear, currentYear + 1].map((yr) => (
            <button
              key={yr}
              onClick={() => setSelectedYear(yr)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedYear === yr
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Meta {yr}
            </button>
          ))}
        </div>
      </div>

      {/* Main Goal Hero Card with Fill Progress Bar */}
      <div className="bg-gradient-to-br from-purple-950/40 via-zinc-900 to-zinc-950 border border-pink-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 space-y-6">
          
          {/* Top Row: Meta Status and Edit Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 text-xs font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Meta de {selectedYear}
                </span>
                {isGoalAchieved && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> META ATINGIDA!
                  </span>
                )}
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Zerar <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">{goal.targetGames} Jogos</span> até o final de {selectedYear}
              </h3>
            </div>

            <button
              onClick={() => setIsEditingGoal(!isEditingGoal)}
              className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-zinc-700 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingGoal ? 'Cancelar Edição' : 'Alterar Meta'}</span>
            </button>
          </div>

          {/* Quick Edit Panel */}
          {isEditingGoal && (
            <div className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-4 animate-in fade-in duration-200">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Definir Novo Objetivo para {selectedYear}
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                    Quantidade de Jogos para Zerar
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={tempTarget}
                    onChange={(e) => setTempTarget(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-white font-bold focus:outline-none focus:border-pink-500"
                  />
                  <div className="flex gap-1.5 mt-2">
                    {[6, 12, 18, 24, 30].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setTempTarget(num)}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold border ${
                          tempTarget === num
                            ? 'bg-pink-600 text-white border-pink-500'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {num} jogos
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                    Meta de Horas de Gameplay (opcional)
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={tempHours}
                    onChange={(e) => setTempHours(parseInt(e.target.value, 10) || 50)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-white font-bold focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingGoal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveGoalSettings}
                  className="px-4 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Nova Meta</span>
                </button>
              </div>
            </div>
          )}

          {/* FILL PROGRESS BAR (BARRA DE PREENCHIMENTO) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
              <span className="text-zinc-300">
                Progresso: <strong className="text-white text-base sm:text-lg">{completedCount}</strong> de <strong className="text-pink-400 text-base sm:text-lg">{goal.targetGames}</strong> jogos zerados
              </span>
              <span className="text-base sm:text-lg font-black text-pink-400">
                {progressPercent}%
              </span>
            </div>

            {/* Visual Progress Bar Track */}
            <div className="relative h-6 sm:h-7 bg-zinc-950/80 rounded-2xl p-1 border border-zinc-800/80 overflow-hidden shadow-inner">
              <div
                className="h-full rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out flex items-center justify-end pr-2 relative shadow-lg shadow-pink-500/30"
                style={{ width: `${Math.max(progressPercent, 4)}%` }}
              >
                {progressPercent >= 15 && (
                  <span className="text-[11px] font-black text-white drop-shadow">
                    {progressPercent}%
                  </span>
                )}
              </div>

              {/* Milestones markers on track */}
              <div className="absolute inset-0 flex justify-between px-6 pointer-events-none items-center text-[10px] text-white/30 font-bold">
                <span className="h-2 w-0.5 bg-white/20" />
                <span className="h-2 w-0.5 bg-white/20" />
                <span className="h-2 w-0.5 bg-white/20" />
              </div>
            </div>

            {/* Milestones Labels */}
            <div className="flex justify-between text-[10px] text-zinc-500 font-semibold px-1">
              <span>0% (Início)</span>
              <span>25% (Aquecimento)</span>
              <span>50% (Metade)</span>
              <span>75% (Reta Final)</span>
              <span>100% (Meta Conquistada)</span>
            </div>
          </div>

          {/* Key Metrics / Pace Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            
            <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">
                Restantes
              </span>
              <div className="text-xl font-black text-white">
                {remainingCount} <span className="text-xs text-zinc-400 font-normal">jogos</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                {remainingCount === 0 ? 'Parabéns, meta batida!' : 'Para alcançar o objetivo'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">
                Ritmo Necessário
              </span>
              <div className="text-xl font-black text-pink-400">
                {paceNeeded} <span className="text-xs text-zinc-400 font-normal">jogos / mês</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Nos próximos {monthsRemaining} meses
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">
                Tempo Jogado em {selectedYear}
              </span>
              <div className="text-xl font-black text-blue-400">
                {totalHoursInYear}h
              </div>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                {goal.targetHours ? `Meta: ${goal.targetHours}h (${Math.min(100, Math.round((totalHoursInYear/goal.targetHours)*100))}%)` : 'Acumulado no ano'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">
                Dias até o Fim do Ano
              </span>
              <div className="text-xl font-black text-amber-400">
                {selectedYear === currentYear ? `${daysRemaining} dias` : 'Ano arquivado'}
              </div>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Até 31 de Dezembro
              </p>
            </div>

          </div>

        </div>
      </div>

      {/* Two columns: Jogos Concluídos do Ano vs Fila de Próximos (Backlog) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Column 1: Jogos Zerados no Ano (Contando para a meta) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-emerald-400" />
                <span>Jogos Zerados em {selectedYear} ({completedCount})</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Títulos que já estão somando na sua barra de progresso
              </p>
            </div>
            <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              {completedCount} computados
            </span>
          </div>

          {completedInYear.length === 0 ? (
            <div className="p-8 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <Gamepad2 className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs sm:text-sm text-zinc-400">
                Nenhum jogo concluído registrado com data em {selectedYear} ainda.
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Ao cadastrar um jogo com data de conclusão neste ano, ele aparecerá aqui automaticamente!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {completedInYear.map((game, idx) => (
                <div
                  key={game.id}
                  onClick={() => onSelectGame(game)}
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-emerald-500/50 hover:bg-zinc-950 transition-all cursor-pointer group"
                >
                  <span className="w-6 text-center text-xs font-bold text-zinc-500 group-hover:text-emerald-400">
                    #{idx + 1}
                  </span>
                  <img
                    src={game.thumbnail}
                    alt={game.title}
                    className="w-10 h-13 rounded-lg object-cover bg-zinc-800 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 truncate">
                      {game.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      {game.platform} • {game.hours}h
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-black text-amber-400 block">
                      ★ {game.rating.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(game.completedDate + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', day: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Fila de Jogos Planejados / Backlog para a Meta */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-pink-400" />
                <span>Próximos na Fila para Zerar ({(goal.backlog || []).length})</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Planeje quais jogos você pretende zerar para alcançar a meta
              </p>
            </div>
          </div>

          {/* Form to add game to backlog */}
          <form onSubmit={handleAddBacklogItem} className="flex gap-2">
            <input
              type="text"
              value={newBacklogTitle}
              onChange={(e) => setNewBacklogTitle(e.target.value)}
              placeholder="Nome do próximo jogo que quer zerar..."
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-pink-500"
            />
            <button
              type="submit"
              disabled={!newBacklogTitle.trim()}
              className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar à Fila</span>
            </button>
          </form>

          {/* Backlog List */}
          {(goal.backlog || []).length === 0 ? (
            <div className="p-8 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <Target className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs sm:text-sm text-zinc-400">
                Sua fila de metas está vazia no momento.
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Adicione jogos que você está jogando ou pretende começar em breve para planejar seus zeramentos!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {(goal.backlog || []).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-pink-500/40 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      🎮
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        {item.platform}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleMarkAsDone(item)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                      title="Marcar como Zerado e Cadastrar"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Zerei!</span>
                    </button>
                    <button
                      onClick={() => handleRemoveBacklogItem(item.id)}
                      className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Remover da lista"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
