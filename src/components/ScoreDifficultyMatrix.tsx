import React, { useState } from 'react';
import { 
  Grid3X3, 
  Star, 
  Flame, 
  Filter, 
  X, 
  Clock, 
  Trophy,
  Info
} from 'lucide-react';
import { Game, GameDifficulty } from '../types';
import { DIFFICULTIES } from '../constants/initialData';

interface ScoreDifficultyMatrixProps {
  games: Game[];
  onSelectGame: (game: Game) => void;
}

export const ScoreDifficultyMatrix: React.FC<ScoreDifficultyMatrixProps> = ({
  games,
  onSelectGame,
}) => {
  // Score range from 0 to 10
  const scores = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const [selectedCell, setSelectedCell] = useState<{
    difficulty?: GameDifficulty;
    score?: number;
  } | null>(null);

  // Group games into buckets (round rating to nearest integer for the matrix, e.g. 9.5 -> 10 or 9)
  const getMatrixCellGames = (diff: GameDifficulty, score: number) => {
    return games.filter((g) => {
      const roundedScore = Math.round(g.rating);
      return g.difficulty === diff && roundedScore === score;
    });
  };

  // Filtered games based on selected cell
  const filteredGames = selectedCell
    ? games.filter((g) => {
        const roundedScore = Math.round(g.rating);
        const matchDiff = selectedCell.difficulty ? g.difficulty === selectedCell.difficulty : true;
        const matchScore = selectedCell.score !== undefined ? roundedScore === selectedCell.score : true;
        return matchDiff && matchScore;
      })
    : [];

  const getDifficultyColor = (diff: GameDifficulty) => {
    switch (diff) {
      case 'Muito Fácil': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Fácil': return 'text-teal-400 bg-teal-500/10 border-teal-500/30';
      case 'Normal': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'Difícil': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Muito Difícil': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    }
  };

  // Find max cell count for heatmap color intensity
  let maxCellCount = 1;
  DIFFICULTIES.forEach((d) => {
    scores.forEach((s) => {
      const count = getMatrixCellGames(d, s).length;
      if (count > maxCellCount) maxCellCount = count;
    });
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <Grid3X3 className="w-6 h-6 text-purple-400" />
          <span>Matriz de Pontuação (0 a 10) x Nível de Dificuldade</span>
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Cruze a avaliação de cada jogo com seu nível de desafio. Clique em qualquer célula para filtrar os títulos correspondentes.
        </p>
      </div>

      {/* Interactive Matrix Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <Info className="w-4 h-4 text-purple-400" />
            <span>Notas são agrupadas de 0 a 10. As cores mais vivas indicam maior concentração de jogos.</span>
          </div>

          {selectedCell && (
            <button
              onClick={() => setSelectedCell(null)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold hover:bg-purple-500/30 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpar Filtro Selecionado</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto p-2 sm:p-4">
          <table className="w-full border-collapse text-center">
            <thead>
              <tr>
                <th className="py-3 px-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider min-w-[130px]">
                  Dificuldade
                </th>
                {scores.map((s) => {
                  const isSelectedScore = selectedCell?.score === s && !selectedCell.difficulty;
                  return (
                    <th key={s} className="py-3 px-1 sm:px-2">
                      <button
                        onClick={() => setSelectedCell({ score: s })}
                        className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          isSelectedScore
                            ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/30'
                            : s >= 9
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/40'
                            : s >= 7
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/40'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                        title={`Filtrar todos com nota ${s}`}
                      >
                        {s}
                      </button>
                    </th>
                  );
                })}
                <th className="py-3 px-3 text-xs font-bold text-zinc-300 uppercase tracking-wider min-w-[90px]">
                  Total
                </th>
                <th className="py-3 px-3 text-xs font-bold text-amber-400 uppercase tracking-wider min-w-[90px]">
                  Média
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800/80">
              {DIFFICULTIES.map((diff) => {
                const diffGames = games.filter((g) => g.difficulty === diff);
                const diffTotal = diffGames.length;
                const diffAvg = diffTotal > 0
                  ? (diffGames.reduce((s, g) => s + g.rating, 0) / diffTotal).toFixed(1)
                  : '-';

                const isDiffSelected = selectedCell?.difficulty === diff && selectedCell.score === undefined;

                return (
                  <tr key={diff} className="hover:bg-zinc-800/30 transition-colors">
                    
                    {/* Dificuldade Row Header */}
                    <td className="py-3 px-3 text-left">
                      <button
                        onClick={() => setSelectedCell({ difficulty: diff })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                          isDiffSelected
                            ? 'ring-2 ring-white ' + getDifficultyColor(diff)
                            : getDifficultyColor(diff)
                        }`}
                      >
                        {diff}
                      </button>
                    </td>

                    {/* Cells 0 to 10 */}
                    {scores.map((score) => {
                      const cellGames = getMatrixCellGames(diff, score);
                      const count = cellGames.length;
                      const isSelected =
                        selectedCell?.difficulty === diff && selectedCell?.score === score;

                      // Heatmap intensity calculation
                      const ratio = count / maxCellCount;
                      let bgStyle = 'bg-zinc-950/60 text-zinc-600 border border-zinc-900';
                      if (count > 0) {
                        if (ratio >= 0.75) {
                          bgStyle = 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black shadow-lg shadow-purple-600/30';
                        } else if (ratio >= 0.4) {
                          bgStyle = 'bg-purple-600/70 text-purple-100 font-bold';
                        } else {
                          bgStyle = 'bg-purple-900/40 text-purple-200 border border-purple-500/30';
                        }
                      }

                      return (
                        <td key={score} className="p-1 sm:p-1.5">
                          <button
                            disabled={count === 0}
                            onClick={() => setSelectedCell({ difficulty: diff, score })}
                            className={`w-9 sm:w-10 h-9 sm:h-10 rounded-xl flex items-center justify-center text-xs transition-all ${
                              count === 0 ? 'opacity-40 cursor-default' : 'cursor-pointer hover:scale-110 active:scale-95'
                            } ${
                              isSelected
                                ? 'ring-2 ring-amber-400 bg-amber-400 text-black font-black'
                                : bgStyle
                            }`}
                            title={`${count} jogo(s) com nota ~${score} na dificuldade ${diff}`}
                          >
                            {count > 0 ? count : '-'}
                          </button>
                        </td>
                      );
                    })}

                    {/* Total Row */}
                    <td className="py-3 px-3 font-extrabold text-white text-sm">
                      {diffTotal}
                    </td>

                    {/* Média */}
                    <td className="py-3 px-3 font-extrabold text-amber-400 text-sm">
                      {diffAvg !== '-' ? `★ ${diffAvg}` : '-'}
                    </td>

                  </tr>
                );
              })}
            </tbody>

            {/* Total Footer Row */}
            <tfoot>
              <tr className="border-t-2 border-zinc-700 bg-zinc-950 font-extrabold text-xs">
                <td className="py-3.5 px-3 text-left uppercase tracking-wider text-zinc-400">
                  Total por Nota
                </td>
                {scores.map((score) => {
                  const scoreTotal = games.filter((g) => Math.round(g.rating) === score).length;
                  return (
                    <td key={score} className="py-3 px-1 text-zinc-300">
                      {scoreTotal > 0 ? (
                        <span className="font-bold text-white text-xs">{scoreTotal}</span>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>
                  );
                })}
                <td className="py-3.5 px-3 text-indigo-400 text-sm font-black">
                  {games.length}
                </td>
                <td className="py-3.5 px-3 text-amber-400 text-sm font-black">
                  ★ {games.length > 0 ? (games.reduce((s, g) => s + g.rating, 0) / games.length).toFixed(1) : '0.0'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Filtered Games List Section when a cell is clicked */}
      {selectedCell && (
        <div className="bg-zinc-900 border border-purple-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Filter className="w-4 h-4 text-purple-400" />
                <span>
                  Jogos Filtrados: {selectedCell.difficulty || 'Todas as Dificuldades'}
                  {selectedCell.score !== undefined ? ` • Nota ~${selectedCell.score}` : ''}
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {filteredGames.length} jogo(s) encontrado(s) nesta seleção
              </p>
            </div>
            <button
              onClick={() => setSelectedCell(null)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {filteredGames.length === 0 ? (
            <p className="text-xs text-zinc-500 italic py-4 text-center">
              Nenhum jogo cadastrado com esta combinação.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredGames.map((game) => (
                <div
                  key={game.id}
                  onClick={() => onSelectGame(game)}
                  className="flex gap-3 p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 hover:border-purple-500/60 hover:bg-zinc-950 transition-all cursor-pointer group"
                >
                  <img
                    src={game.thumbnail}
                    alt={game.title}
                    className="w-14 h-18 rounded-xl object-cover bg-zinc-800 flex-shrink-0 group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white group-hover:text-purple-300 truncate">
                      {game.title}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {game.platform}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs font-black text-amber-400 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {game.rating.toFixed(1)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getDifficultyColor(game.difficulty)}`}>
                        {game.difficulty}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {game.hours}h
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analysis Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Insight 1: Jogo mais difícil */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Flame className="w-4 h-4" /> Desafio Extremo
          </div>
          <div className="text-sm text-zinc-200">
            {games.filter((g) => g.difficulty === 'Muito Difícil').length} jogos zerados no modo <strong>Muito Difícil / Hardcore</strong>.
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Média de horas desse grupo: {
              (games.filter((g) => g.difficulty === 'Muito Difícil').reduce((s, g) => s + g.hours, 0) /
              Math.max(games.filter((g) => g.difficulty === 'Muito Difícil').length, 1)).toFixed(0)
            }h por jogo
          </p>
        </div>

        {/* Insight 2: Obras-primas (Nota 10) */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Star className="w-4 h-4 fill-amber-400" /> Obras-Primas (Nota 10)
          </div>
          <div className="text-sm text-zinc-200">
            {games.filter((g) => g.rating === 10).length} jogos receberam <strong>Nota 10 Máxima</strong> na sua avaliação pessoal.
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Representam {games.length > 0 ? ((games.filter((g) => g.rating === 10).length / games.length) * 100).toFixed(0) : 0}% da sua biblioteca
          </p>
        </div>

        {/* Insight 3: Dificuldade Normal */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Trophy className="w-4 h-4" /> Zona de Conforto
          </div>
          <div className="text-sm text-zinc-200">
            Dificuldade mais zerada: <strong>{
              DIFFICULTIES.slice().sort((a, b) => 
                games.filter((g) => g.difficulty === b).length - games.filter((g) => g.difficulty === a).length
              )[0]
            }</strong>.
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Excelente equilíbrio entre imersão e narrativa
          </p>
        </div>

      </div>

    </div>
  );
};
