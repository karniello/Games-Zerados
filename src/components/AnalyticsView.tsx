import React, { useMemo, useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Area, 
  AreaChart 
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  Star, 
  Trophy, 
  Flame, 
  Award, 
  Layers, 
  CheckCircle2, 
  Sparkles,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Game } from '../types';

interface AnalyticsViewProps {
  games: Game[];
  onSelectGame?: (game: Game) => void;
}

const MONTH_NAMES_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const MONTH_NAMES_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ games, onSelectGame }) => {
  const [metricMode, setMetricMode] = useState<'all' | 'games' | 'hours' | 'cumulative'>('all');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);

  // Compute the last 12 months relative to current date (or latest game date if future/demo)
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: {
      key: string; // YYYY-MM
      label: string;
      fullLabel: string;
      year: number;
      month: number;
      gamesCompleted: number;
      cumulativeGames: number;
      hoursPlayed: number;
      averageRating: number;
      games: Game[];
    }[] = [];

    // Generate chronological array for the last 12 months
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const key = `${year}-${String(month).padStart(2, '0')}`;
      const label = `${MONTH_NAMES_SHORT[month - 1]}/${String(year).slice(-2)}`;
      const fullLabel = `${MONTH_NAMES_FULL[month - 1]} de ${year}`;

      // Filter games completed in this month
      const monthGames = games.filter((g) => {
        if (!g.completedDate) return false;
        return g.completedDate.startsWith(key);
      });

      const totalHours = monthGames.reduce((acc, g) => acc + (Number(g.hours) || 0), 0);
      const avgRating = monthGames.length > 0 
        ? Number((monthGames.reduce((acc, g) => acc + (Number(g.rating) || 0), 0) / monthGames.length).toFixed(1))
        : 0;

      months.push({
        key,
        label,
        fullLabel,
        year,
        month,
        gamesCompleted: monthGames.length,
        cumulativeGames: 0, // will calculate below
        hoursPlayed: Math.round(totalHours * 10) / 10,
        averageRating: avgRating,
        games: monthGames,
      });
    }

    // Calculate cumulative sum
    let runningTotal = 0;
    months.forEach((m) => {
      runningTotal += m.gamesCompleted;
      m.cumulativeGames = runningTotal;
    });

    return months;
  }, [games]);

  // Overall statistics for the last 12 months
  const stats = useMemo(() => {
    const totalGames = monthlyData.reduce((acc, m) => acc + m.gamesCompleted, 0);
    const totalHours = monthlyData.reduce((acc, m) => acc + m.hoursPlayed, 0);
    const averagePerMonth = (totalGames / 12).toFixed(1);
    const avgHoursPerGame = totalGames > 0 ? (totalHours / totalGames).toFixed(1) : '0';

    // Best month
    let bestMonth = monthlyData[0];
    monthlyData.forEach((m) => {
      if (m.gamesCompleted > bestMonth.gamesCompleted) {
        bestMonth = m;
      }
    });

    // Rating average of games in this 12m period
    const allGamesInPeriod = monthlyData.flatMap((m) => m.games);
    const avgRating = allGamesInPeriod.length > 0
      ? (allGamesInPeriod.reduce((acc, g) => acc + g.rating, 0) / allGamesInPeriod.length).toFixed(1)
      : '0.0';

    // Top genre in this period
    const genreCounts: Record<string, number> = {};
    allGamesInPeriod.forEach((g) => {
      genreCounts[g.genre] = (genreCounts[g.genre] || 0) + 1;
    });
    const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Geral';

    return {
      totalGames,
      totalHours: Math.round(totalHours),
      averagePerMonth,
      avgHoursPerGame,
      bestMonth,
      avgRating,
      topGenre,
    };
  }, [monthlyData]);

  // Games in currently active month drilldown
  const activeMonthGames = useMemo(() => {
    if (!selectedMonthKey) {
      // Default to the latest month with games, or the very last month
      const monthWithGames = [...monthlyData].reverse().find((m) => m.gamesCompleted > 0);
      return monthWithGames ? monthWithGames.games : monthlyData[monthlyData.length - 1].games;
    }
    const found = monthlyData.find((m) => m.key === selectedMonthKey);
    return found ? found.games : [];
  }, [selectedMonthKey, monthlyData]);

  const activeMonthLabel = useMemo(() => {
    if (!selectedMonthKey) {
      const monthWithGames = [...monthlyData].reverse().find((m) => m.gamesCompleted > 0);
      return monthWithGames ? monthWithGames.fullLabel : monthlyData[monthlyData.length - 1].fullLabel;
    }
    const found = monthlyData.find((m) => m.key === selectedMonthKey);
    return found ? found.fullLabel : '';
  }, [selectedMonthKey, monthlyData]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-950/95 border border-purple-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-xl text-xs max-w-xs space-y-2.5 z-50">
          <div className="border-b border-zinc-800 pb-2">
            <p className="font-bold text-sm text-white flex items-center justify-between">
              <span>{data.fullLabel}</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono">
                {data.gamesCompleted} {data.gamesCompleted === 1 ? 'jogo' : 'jogos'}
              </span>
            </p>
          </div>

          <div className="space-y-1.5 text-zinc-300">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-purple-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Zerados no mês:
              </span>
              <strong className="text-white text-sm">{data.gamesCompleted}</strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <TrendingUp className="w-3.5 h-3.5" /> Total Acumulado:
              </span>
              <strong className="text-white">{data.cumulativeGames} jogos</strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Clock className="w-3.5 h-3.5" /> Horas jogadas:
              </span>
              <strong className="text-emerald-300">{data.hoursPlayed}h</strong>
            </div>

            {data.averageRating > 0 && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" /> Nota média:
                </span>
                <strong className="text-amber-300">{data.averageRating} / 10</strong>
              </div>
            )}
          </div>

          {data.games.length > 0 && (
            <div className="pt-2 border-t border-zinc-800/80">
              <p className="text-[10px] text-zinc-400 font-semibold mb-1.5">Títulos zerados:</p>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {data.games.slice(0, 4).map((g: Game) => (
                  <span
                    key={g.id}
                    className="inline-block px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-200 text-[10px] truncate max-w-[140px]"
                    title={g.title}
                  >
                    {g.title}
                  </span>
                ))}
                {data.games.length > 4 && (
                  <span className="text-[10px] text-purple-400 font-semibold self-center">
                    +{data.games.length - 4} mais
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-lg shadow-purple-600/30">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span>Analytics & Tendência Mensal</span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1.5">
            Evolução histórica de jogos zerados, ritmo de conclusão e horas dedicadas nos últimos 12 meses
          </p>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex flex-wrap items-center bg-zinc-900/90 border border-zinc-800 p-1.5 rounded-2xl shadow-md gap-1">
          <button
            onClick={() => setMetricMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              metricMode === 'all'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Visão Completa
          </button>
          <button
            onClick={() => setMetricMode('games')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              metricMode === 'games'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Jogos Zerados
          </button>
          <button
            onClick={() => setMetricMode('cumulative')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              metricMode === 'cumulative'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Evolução Cumulativa
          </button>
          <button
            onClick={() => setMetricMode('hours')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              metricMode === 'hours'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Horas Jogadas
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Card 1: Total Games in 12 Months */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-purple-500/40 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Últimos 12 Meses</span>
            <Trophy className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {stats.totalGames}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>jogos concluídos</span>
          </p>
        </div>

        {/* Card 2: Average games per month */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Ritmo Mensal</span>
            <TrendingUp className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-300">
            {stats.averagePerMonth}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            jogos por mês
          </p>
        </div>

        {/* Card 3: Total Hours */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Tempo Total</span>
            <Clock className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-300">
            {stats.totalHours}h
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            dedicadas à campanha
          </p>
        </div>

        {/* Card 4: Average Hours per game */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-teal-500/40 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Média / Jogo</span>
            <Clock className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-300">
            {stats.avgHoursPerGame}h
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            duração média
          </p>
        </div>

        {/* Card 5: Best Month */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-pink-500/40 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Mês Recorde</span>
            <Flame className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-lg sm:text-xl font-black text-pink-300 truncate">
            {stats.bestMonth.label}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            {stats.bestMonth.gamesCompleted} jogos zerados
          </p>
        </div>

        {/* Card 6: Average Rating */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Avaliação Média</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 flex items-baseline gap-1">
            <span>{stats.avgRating}</span>
            <span className="text-xs text-zinc-500 font-normal">/10</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            gênero top: <strong className="text-zinc-200">{stats.topGenre}</strong>
          </p>
        </div>

      </div>

      {/* Main Line Chart Card */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 relative z-10">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>Tendência Mensal (Últimos 12 Meses)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Passe o cursor sobre os pontos para visualizar o resumo detalhado de cada mês
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500 inline-block shadow-sm shadow-purple-500/50" />
              <span className="text-zinc-300">Jogos Zerados</span>
            </div>
            {(metricMode === 'all' || metricMode === 'cumulative') && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 bg-blue-500 inline-block rounded" />
                <span className="text-zinc-300">Cumulativo</span>
              </div>
            )}
            {(metricMode === 'all' || metricMode === 'hours') && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50" />
                <span className="text-zinc-300">Horas (h)</span>
              </div>
            )}
          </div>
        </div>

        {/* Recharts Responsive Container */}
        <div className="h-72 sm:h-96 w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={monthlyData}
              margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload[0]) {
                  setSelectedMonthKey(e.activePayload[0].payload.key);
                }
              }}
            >
              <defs>
                <linearGradient id="gamesAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />

              <XAxis 
                dataKey="label" 
                stroke="#52525b"
                tick={{ fill: '#a1a1aa', fontSize: 12, fontWeight: 500 }}
                tickLine={false}
                axisLine={{ stroke: '#3f3f46' }}
              />

              <YAxis 
                stroke="#52525b"
                allowDecimals={false}
                tick={{ fill: '#a1a1aa', fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#3f3f46' }}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Games Line */}
              {(metricMode === 'all' || metricMode === 'games') && (
                <Line
                  type="monotone"
                  dataKey="gamesCompleted"
                  name="Jogos Zerados"
                  stroke="#a855f7"
                  strokeWidth={3.5}
                  dot={{ r: 5, fill: '#a855f7', stroke: '#18181b', strokeWidth: 2 }}
                  activeDot={{ r: 8, fill: '#d8b4fe', stroke: '#7e22ce', strokeWidth: 2 }}
                />
              )}

              {/* Cumulative Line */}
              {(metricMode === 'all' || metricMode === 'cumulative') && (
                <Line
                  type="monotone"
                  dataKey="cumulativeGames"
                  name="Evolução Cumulativa"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#3b82f6' }}
                />
              )}

              {/* Hours Line */}
              {(metricMode === 'all' || metricMode === 'hours') && (
                <Line
                  type="monotone"
                  dataKey="hoursPlayed"
                  name="Horas Jogadas"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981', stroke: '#18181b', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#6ee7b7' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Footer info & interactive hint */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 mt-4 pt-3 border-t border-zinc-800/80">
          <span>Dica: Clique em qualquer ponto ou mês do gráfico para inspecionar os jogos zerados no período abaixo</span>
          <span className="font-mono text-zinc-400">Total no período: {stats.totalGames} jogos • {stats.totalHours} horas</span>
        </div>
      </div>

      {/* Drilldown Section: Games Completed in Selected Month */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              <span>Jogos Zerados em: <span className="text-purple-300">{activeMonthLabel}</span></span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {activeMonthGames.length === 0 
                ? 'Nenhum jogo cadastrado com data de conclusão neste mês.'
                : `${activeMonthGames.length} ${activeMonthGames.length === 1 ? 'título concluído' : 'títulos concluídos'} neste mês.`}
            </p>
          </div>

          {/* Month Quick Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 max-w-full">
            {monthlyData.map((m) => (
              <button
                key={m.key}
                onClick={() => setSelectedMonthKey(m.key)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  (selectedMonthKey === m.key || (!selectedMonthKey && m.gamesCompleted > 0 && m.games === activeMonthGames))
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : m.gamesCompleted > 0
                    ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                    : 'bg-zinc-950/60 text-zinc-500 hover:text-zinc-400'
                }`}
              >
                {m.label} {m.gamesCompleted > 0 && `(${m.gamesCompleted})`}
              </button>
            ))}
          </div>
        </div>

        {/* Month Games Grid */}
        {activeMonthGames.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/40">
            <Calendar className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-400 font-medium">Nenhum jogo concluído neste mês</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Selecione outro mês acima ou cadastre novos jogos com a data de conclusão correspondente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeMonthGames.map((game) => (
              <div
                key={game.id}
                onClick={() => onSelectGame && onSelectGame(game)}
                className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-3 flex gap-3 hover:border-purple-500/50 hover:bg-zinc-900/60 transition-all cursor-pointer group shadow-md"
              >
                <img
                  src={game.thumbnail}
                  alt={game.title}
                  className="w-16 h-22 rounded-xl object-cover flex-shrink-0 shadow-md group-hover:scale-105 transition-transform"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                      {game.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400 truncate">{game.platform}</p>
                    <span className="inline-block px-1.5 py-0.5 mt-1 rounded text-[10px] bg-zinc-800 text-zinc-300">
                      {game.genre}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-800/80 text-[11px]">
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{game.rating}</span>
                    </span>
                    <span className="text-zinc-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-400" />
                      <span>{game.hours}h</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
