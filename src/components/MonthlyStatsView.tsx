import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Star, 
  TrendingUp, 
  ChevronRight, 
  Sparkles, 
  Trophy,
  Filter,
  FileText,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { Game, UserProfile } from '../types';
import { exportStatsToPDF, exportGamesToExcel } from '../services/reports';

interface MonthlyStatsViewProps {
  games: Game[];
  currentUser: UserProfile;
  onSelectGame: (game: Game) => void;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const MONTH_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export const MonthlyStatsView: React.FC<MonthlyStatsViewProps> = ({
  games,
  currentUser,
  onSelectGame,
}) => {
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  const handleDownloadPDF = () => {
    try {
      exportStatsToPDF(games, currentUser);
      setDownloadFeedback('Relatório PDF gerado e baixado com sucesso!');
      setTimeout(() => setDownloadFeedback(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadExcel = () => {
    try {
      exportGamesToExcel(games, currentUser);
      setDownloadFeedback('Planilha Excel (.xlsx) gerada e baixada com sucesso!');
      setTimeout(() => setDownloadFeedback(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  // Extract all available years
  const availableYears = Array.from(
    new Set(
      games
        .map((g) => g.completedDate?.substring(0, 4))
        .filter((y): y is string => !!y && y.length === 4)
    )
  ).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));

  const currentYearStr = new Date().getFullYear().toString();
  const defaultSelectedYear = availableYears.includes(currentYearStr)
    ? currentYearStr
    : availableYears[0] || currentYearStr;

  const [selectedYear, setSelectedYear] = useState<string>(defaultSelectedYear);
  const [isAllYears, setIsAllYears] = useState(false);

  // Filter games based on selected year
  const relevantGames = isAllYears
    ? games
    : games.filter((g) => g.completedDate?.startsWith(selectedYear));

  // Compute monthly data for 12 months (0 to 11)
  const monthlyData = MONTH_NAMES.map((name, index) => {
    const monthIndexStr = (index + 1).toString().padStart(2, '0');
    
    const monthGames = relevantGames.filter((g) => {
      if (!g.completedDate) return false;
      const parts = g.completedDate.split('-');
      return parts[1] === monthIndexStr;
    });

    const count = monthGames.length;
    const hours = monthGames.reduce((sum, g) => sum + (g.hours || 0), 0);
    const avgRating = count > 0
      ? (monthGames.reduce((sum, g) => sum + g.rating, 0) / count).toFixed(1)
      : '-';

    return {
      monthIndex: index,
      monthName: name,
      shortName: MONTH_SHORT[index],
      games: monthGames,
      count,
      hours,
      avgRating,
    };
  });

  const maxMonthCount = Math.max(...monthlyData.map((m) => m.count), 1);
  const totalRelevantHours = relevantGames.reduce((s, g) => s + (g.hours || 0), 0);
  const totalRelevantGames = relevantGames.length;
  
  // Find top month
  const bestMonthByCount = [...monthlyData].sort((a, b) => b.count - a.count)[0];
  const bestMonthByHours = [...monthlyData].sort((a, b) => b.hours - a.hours)[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header, Export Buttons and Filter Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-400" />
            <span>Estatísticas Gerais por Mês</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Distribuição mensal de conclusões, horas de gameplay acumuladas e notas médias
          </p>
        </div>

        {/* Action Controls: Export and Year */}
        <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto">
          
          {/* Download Buttons */}
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all active:scale-95 cursor-pointer"
            title="Baixar Relatório Completo em PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>

          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-emerald-400 hover:text-emerald-300 text-xs font-bold border border-zinc-700/80 transition-all active:scale-95 cursor-pointer"
            title="Baixar Planilha Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Excel (.xlsx)</span>
          </button>

          {/* Year Filter Controls */}
          <div className="flex items-center gap-1.5 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
            <button
              onClick={() => setIsAllYears(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isAllYears
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todos os Anos
            </button>

            {availableYears.map((yr) => (
              <button
                key={yr}
                onClick={() => {
                  setIsAllYears(false);
                  setSelectedYear(yr);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !isAllYears && selectedYear === yr
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>

        </div>
      </div>

      {downloadFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{downloadFeedback}</span>
        </div>
      )}

      {/* Highlights for the selected timeframe */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
              Mês Mais Produtivo
            </span>
            <div className="text-lg font-black text-white">
              {bestMonthByCount.count > 0 ? `${bestMonthByCount.monthName}` : 'Nenhum'}
            </div>
            <p className="text-xs text-indigo-400 font-medium">
              {bestMonthByCount.count} jogos zerados
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
              Pico de Horas Jogadas
            </span>
            <div className="text-lg font-black text-white">
              {bestMonthByHours.hours > 0 ? `${bestMonthByHours.monthName}` : 'Nenhum'}
            </div>
            <p className="text-xs text-blue-400 font-medium">
              {bestMonthByHours.hours} horas acumuladas
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
              Média no Período
            </span>
            <div className="text-lg font-black text-white">
              {(totalRelevantGames / 12).toFixed(1)} <span className="text-xs text-zinc-400 font-normal">jogos / mês</span>
            </div>
            <p className="text-xs text-emerald-400 font-medium">
              Total de {totalRelevantHours}h no período
            </p>
          </div>
        </div>

      </div>

      {/* Monthly Bar Chart Visualizer */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <span>Gráfico Comparativo Mensal ({isAllYears ? 'Histórico Completo' : selectedYear})</span>
        </h3>

        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-6 items-end h-48 sm:h-52 border-b border-zinc-800 pb-2">
          {monthlyData.map((item) => {
            const heightPercent = item.count > 0 ? Math.max((item.count / maxMonthCount) * 100, 15) : 4;
            return (
              <div key={item.monthIndex} className="flex flex-col items-center h-full justify-end group">
                <span className="text-[11px] font-black text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                  {item.count > 0 ? `${item.count}j` : ''}
                </span>
                <div
                  className={`w-full max-w-[36px] rounded-t-xl transition-all ${
                    item.count > 0
                      ? 'bg-gradient-to-t from-indigo-600 via-purple-600 to-pink-500 group-hover:brightness-125'
                      : 'bg-zinc-800/40'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[11px] font-bold text-zinc-400 mt-2">
                  {item.shortName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 12 Months Detailed Grid with Thumbnails */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {monthlyData.map((item) => (
          <div
            key={item.monthIndex}
            className={`rounded-3xl border p-5 flex flex-col justify-between transition-all ${
              item.count > 0
                ? 'bg-zinc-900 border-zinc-800 hover:border-indigo-500/50 shadow-lg'
                : 'bg-zinc-900/40 border-zinc-800/40 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-extrabold text-white">
                  {item.monthName}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                  item.count > 0
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {item.count} {item.count === 1 ? 'jogo' : 'jogos'}
                </span>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div className="p-2 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 block">Tempo jogado</span>
                  <span className="font-bold text-zinc-200">{item.hours}h</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 block">Nota média</span>
                  <span className="font-bold text-amber-400">
                    {item.avgRating !== '-' ? `★ ${item.avgRating}` : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Games Covers list for this month */}
            {item.games.length > 0 ? (
              <div>
                <span className="text-[11px] font-bold text-zinc-400 block mb-2">
                  Jogos Concluídos:
                </span>
                <div className="flex flex-wrap gap-2">
                  {item.games.map((g) => (
                    <div
                      key={g.id}
                      onClick={() => onSelectGame(g)}
                      className="group relative cursor-pointer"
                      title={`${g.title} (${g.hours}h - ★ ${g.rating})`}
                    >
                      <img
                        src={g.thumbnail}
                        alt={g.title}
                        className="w-10 h-14 rounded-lg object-cover ring-1 ring-white/10 group-hover:ring-indigo-400 group-hover:scale-110 transition-all bg-zinc-800 shadow-md"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-600 italic py-2">
                Nenhum jogo concluído neste mês.
              </p>
            )}

          </div>
        ))}
      </div>

    </div>
  );
};
