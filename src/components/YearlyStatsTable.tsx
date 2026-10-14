import React, { useState } from 'react';
import { 
  Trophy, 
  Clock, 
  Calendar, 
  Star, 
  TrendingUp, 
  Award, 
  Flame, 
  Layers,
  ChevronRight,
  FileText,
  FileSpreadsheet,
  Download,
  CheckCircle2
} from 'lucide-react';
import { Game, GameDifficulty, UserProfile } from '../types';
import { DIFFICULTIES } from '../constants/initialData';
import { exportStatsToPDF, exportGamesToExcel } from '../services/reports';

interface YearlyStatsTableProps {
  games: Game[];
  currentUser: UserProfile;
  onSelectGame: (game: Game) => void;
}

export const YearlyStatsTable: React.FC<YearlyStatsTableProps> = ({
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
  // Aggregate stats
  const totalGames = games.length;
  const totalHours = games.reduce((sum, g) => sum + (g.hours || 0), 0);
  const totalDays = (totalHours / 24).toFixed(1);
  const averageRating = totalGames > 0
    ? (games.reduce((sum, g) => sum + g.rating, 0) / totalGames).toFixed(1)
    : '0.0';
  const totalPlatinas = games.filter(
    (g) => g.completionCondition.includes('Platina') || g.completionCondition.includes('100%')
  ).length;

  // Group by Year
  const yearMap: { [year: string]: Game[] } = {};
  games.forEach((g) => {
    const year = g.completedDate ? g.completedDate.substring(0, 4) : 'Outros';
    if (!yearMap[year]) yearMap[year] = [];
    yearMap[year].push(g);
  });

  const sortedYears = Object.keys(yearMap).sort((a, b) => {
    if (a === 'Outros') return 1;
    if (b === 'Outros') return -1;
    return parseInt(b, 10) - parseInt(a, 10);
  });

  // Calculate difficulty distribution
  const difficultyCounts = DIFFICULTIES.map((diff) => {
    const count = games.filter((g) => g.difficulty === diff).length;
    const percentage = totalGames > 0 ? ((count / totalGames) * 100).toFixed(0) : '0';
    const hours = games
      .filter((g) => g.difficulty === diff)
      .reduce((sum, g) => sum + (g.hours || 0), 0);
    const avgScore = count > 0
      ? (games.filter((g) => g.difficulty === diff).reduce((s, g) => s + g.rating, 0) / count).toFixed(1)
      : '0.0';
    return { difficulty: diff, count, percentage, hours, avgScore };
  });

  const getDifficultyColor = (diff: GameDifficulty) => {
    switch (diff) {
      case 'Muito Fácil': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Fácil': return 'text-teal-400 bg-teal-500/10 border-teal-500/30';
      case 'Normal': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'Difícil': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Muito Difícil': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    }
  };

  const maxYearGames = Math.max(...sortedYears.map((y) => yearMap[y].length), 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner & Highlights with Export Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>Jogos Zerados por Ano & Total Acumulado</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Acompanhe sua trajetória gamer, total de horas dedicadas e evolução anual
          </p>
        </div>

        {/* Export Buttons: PDF and Excel */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all active:scale-95 cursor-pointer"
            title="Baixar Relatório Completo em PDF com Resumo, Gráficos e Jogos"
          >
            <FileText className="w-4 h-4" />
            <span>Baixar Relatório PDF</span>
          </button>

          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-emerald-400 hover:text-emerald-300 text-xs font-bold border border-zinc-700/80 transition-all active:scale-95 cursor-pointer"
            title="Baixar Planilha Excel com Resumo e Lista de Jogos"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Baixar Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {downloadFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{downloadFeedback}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Total Zerados */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-900/40 via-zinc-900 to-zinc-950 border border-indigo-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Total Zerados</span>
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {totalGames} <span className="text-xs text-zinc-400 font-normal">títulos</span>
          </div>
          <p className="text-[11px] text-indigo-300/80 mt-1">Concluídos na sua biblioteca</p>
        </div>

        {/* Total Horas */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-900/40 via-zinc-900 to-zinc-950 border border-blue-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Horas Totais</span>
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {totalHours}h
          </div>
          <p className="text-[11px] text-blue-300/80 mt-1">Equivalente a {totalDays} dias de jogo</p>
        </div>

        {/* Nota Média */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-900/40 via-zinc-900 to-zinc-950 border border-amber-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Nota Média</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            ★ {averageRating} <span className="text-xs text-zinc-400 font-normal">/ 10</span>
          </div>
          <p className="text-[11px] text-amber-300/80 mt-1">Média de satisfação geral</p>
        </div>

        {/* 100% / Platinas */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-900/40 via-zinc-900 to-zinc-950 border border-purple-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300">100% & Platinas</span>
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {totalPlatinas} <span className="text-xs text-zinc-400 font-normal">({totalGames > 0 ? ((totalPlatinas/totalGames)*100).toFixed(0) : 0}%)</span>
          </div>
          <p className="text-[11px] text-purple-300/80 mt-1">Completados ao máximo</p>
        </div>

        {/* Média de Horas / Jogo */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-900/40 via-zinc-900 to-zinc-950 border border-emerald-500/30 shadow-lg col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Média Horas/Jogo</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {totalGames > 0 ? (totalHours / totalGames).toFixed(1) : 0}h
          </div>
          <p className="text-[11px] text-emerald-300/80 mt-1">Duração média de cada zeramento</p>
        </div>

      </div>

      {/* Main Table: Quantidade de Jogos Zerados por Ano e Total */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <span>Tabela Histórica de Zeramentos por Ano</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Dados consolidados de quantidade, horas jogadas e jogo destaque de cada ano
            </p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold self-start sm:self-auto">
            {sortedYears.length} anos registrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/70 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Ano</th>
                <th className="py-3.5 px-4">Jogos Zerados</th>
                <th className="py-3.5 px-4">Horas Totais</th>
                <th className="py-3.5 px-4">Média Horas</th>
                <th className="py-3.5 px-4">Nota Média</th>
                <th className="py-3.5 px-4">Dificuldade Frequente</th>
                <th className="py-3.5 px-4">Platinas / 100%</th>
                <th className="py-3.5 px-4 sm:px-6">Melhor Jogo do Ano</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-xs sm:text-sm">
              {sortedYears.map((year) => {
                const yearGames = yearMap[year];
                const yearCount = yearGames.length;
                const yearHours = yearGames.reduce((s, g) => s + (g.hours || 0), 0);
                const yearAvgHours = (yearHours / yearCount).toFixed(1);
                const yearAvgRating = (yearGames.reduce((s, g) => s + g.rating, 0) / yearCount).toFixed(1);
                
                // Difficulty frequency
                const diffMap: { [k: string]: number } = {};
                yearGames.forEach((g) => {
                  diffMap[g.difficulty] = (diffMap[g.difficulty] || 0) + 1;
                });
                const dominantDiff = Object.keys(diffMap).sort((a, b) => diffMap[b] - diffMap[a])[0] as GameDifficulty;

                // 100% / Platina count
                const yearPlats = yearGames.filter(
                  (g) => g.completionCondition.includes('Platina') || g.completionCondition.includes('100%')
                ).length;

                // Best game
                const topGame = [...yearGames].sort((a, b) => b.rating - a.rating)[0];

                const percentageOfMax = (yearCount / maxYearGames) * 100;

                return (
                  <tr key={year} className="hover:bg-zinc-800/40 transition-colors">
                    
                    {/* Ano */}
                    <td className="py-4 px-4 sm:px-6 font-bold text-white text-base">
                      {year}
                    </td>

                    {/* Jogos Zerados + Progress Bar */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-white text-base min-w-[28px]">
                          {yearCount}
                        </span>
                        <div className="w-20 sm:w-28 bg-zinc-800 h-2 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full"
                            style={{ width: `${percentageOfMax}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Horas */}
                    <td className="py-4 px-4 text-zinc-300 font-semibold">
                      {yearHours}h
                    </td>

                    {/* Média Horas */}
                    <td className="py-4 px-4 text-zinc-400">
                      {yearAvgHours}h / jogo
                    </td>

                    {/* Nota Média */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        {yearAvgRating}
                      </span>
                    </td>

                    {/* Dificuldade Frequente */}
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${getDifficultyColor(dominantDiff)}`}>
                        {dominantDiff}
                      </span>
                    </td>

                    {/* Platinas */}
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold text-xs">
                        {yearPlats}
                      </span>
                    </td>

                    {/* Melhor Jogo */}
                    <td className="py-4 px-4 sm:px-6">
                      {topGame ? (
                        <div
                          onClick={() => onSelectGame(topGame)}
                          className="flex items-center gap-2 group cursor-pointer"
                        >
                          <img
                            src={topGame.thumbnail}
                            alt={topGame.title}
                            className="w-7 h-9 rounded object-cover flex-shrink-0 bg-zinc-800 group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-zinc-200 group-hover:text-indigo-400 truncate max-w-[140px] sm:max-w-[200px]">
                              {topGame.title}
                            </p>
                            <span className="text-[10px] text-amber-400 font-semibold">
                              ★ {topGame.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-zinc-500 text-xs">-</span>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
            
            {/* TOTAL GERAL ROW (Highlighted at Bottom) */}
            <tfoot>
              <tr className="bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-zinc-950 border-t-2 border-indigo-500/50 text-white font-extrabold text-sm">
                <td className="py-4 px-4 sm:px-6 uppercase tracking-wider text-indigo-300">
                  TOTAL GERAL
                </td>
                <td className="py-4 px-4 text-base text-white">
                  {totalGames} jogos
                </td>
                <td className="py-4 px-4 text-indigo-200">
                  {totalHours}h
                </td>
                <td className="py-4 px-4 text-zinc-300">
                  {totalGames > 0 ? (totalHours / totalGames).toFixed(1) : 0}h
                </td>
                <td className="py-4 px-4 text-amber-400">
                  ★ {averageRating}
                </td>
                <td className="py-4 px-4 text-zinc-300">
                  Todos Níveis
                </td>
                <td className="py-4 px-4 text-purple-300">
                  {totalPlatinas} Platinas
                </td>
                <td className="py-4 px-4 sm:px-6 text-zinc-400 text-xs font-normal">
                  Base 100% sincronizada
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Dificuldade: Seção detalhada de Distribuição e Horas */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-400" />
            <span>Distribuição por Nível de Dificuldade</span>
          </h3>
          <p className="text-xs text-zinc-400">
            Quantidade de jogos zerados, percentual e média de horas por cada nível de desafio
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {difficultyCounts.map((item) => (
            <div
              key={item.difficulty}
              className={`p-4 rounded-2xl border ${getDifficultyColor(item.difficulty)} flex flex-col justify-between`}
            >
              <div>
                <span className="text-xs font-extrabold block mb-1">
                  {item.difficulty}
                </span>
                <div className="text-2xl font-black text-white">
                  {item.count} <span className="text-xs font-normal text-zinc-400">({item.percentage}%)</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-1 text-[11px] text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Horas Totais:</span>
                  <span className="font-bold text-white">{item.hours}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Nota Média:</span>
                  <span className="font-bold text-amber-400">★ {item.avgScore}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
