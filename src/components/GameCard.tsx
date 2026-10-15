import React from 'react';
import { 
  Star, 
  Clock, 
  Calendar, 
  Trophy, 
  Heart, 
  MoreVertical, 
  Edit3, 
  Trash2,
  CheckCircle2,
  PenLine
} from 'lucide-react';
import { Game, GameDifficulty } from '../types';

interface GameCardProps {
  game: Game;
  onSelect: (game: Game) => void;
  onEdit: (game: Game) => void;
  onDelete: (id: string, game?: Game) => void;
  onToggleFavorite: (id: string) => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  onSelect,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  const getDifficultyColor = (diff: GameDifficulty) => {
    switch (diff) {
      case 'Muito Fácil': return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
      case 'Fácil': return 'text-teal-400 bg-teal-500/15 border-teal-500/30';
      case 'Normal': return 'text-blue-400 bg-blue-500/15 border-blue-500/30';
      case 'Difícil': return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
      case 'Muito Difícil': return 'text-rose-400 bg-rose-500/15 border-rose-500/30';
    }
  };

  const formattedDate = new Date(game.completedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="group relative bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between">
      
      {/* Poster Image Container */}
      <div 
        onClick={() => onSelect(game)} 
        className="relative aspect-[3/4] overflow-hidden bg-zinc-950 cursor-pointer"
      >
        <img
          src={game.thumbnail}
          alt={game.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80';
          }}
        />

        {/* Gradient shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

        {/* Top Badges: Rating & Favorite */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/75 backdrop-blur-md text-amber-400 border border-amber-500/30 shadow">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span className="text-xs font-black">{game.rating.toFixed(1)}</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(game.id);
            }}
            className={`p-1.5 rounded-xl backdrop-blur-md transition-all cursor-pointer ${
              game.favorite
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40'
                : 'bg-black/60 text-zinc-400 hover:text-white'
            }`}
            title={game.favorite ? 'Favoritado' : 'Adicionar aos favoritos'}
          >
            <Heart className={`w-3.5 h-3.5 ${game.favorite ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Bottom Poster Info: Platform & Condition */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5">
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2 py-0.5 rounded-lg bg-zinc-900/90 backdrop-blur-md text-zinc-200 text-[10px] font-bold border border-white/10">
              {game.platform}
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-indigo-950/90 backdrop-blur-md text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
              {game.completionCondition}
            </span>
          </div>
        </div>
      </div>

      {/* Card Body Details */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div onClick={() => onSelect(game)} className="cursor-pointer">
          <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
            {game.title}
          </h3>
          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
            {game.genre} {game.developer ? `• ${game.developer}` : ''}
          </p>
        </div>

        {/* Metrics Row */}
        <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs">
          
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-bold">{game.hours}h</span>
          </div>

          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getDifficultyColor(game.difficulty)}`}>
            {game.difficulty}
          </span>
        </div>

        {/* Footer with date and actions */}
        <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5 text-zinc-400 truncate">
            <Calendar className="w-3 h-3 text-zinc-500 flex-shrink-0" />
            <span>{formattedDate}</span>
            {game.notes?.trim() && (
              <span
                className="inline-flex items-center text-purple-400 ml-0.5"
                title="Possui review/anotações pessoais"
              >
                <PenLine className="w-3 h-3" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(game)}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Editar"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(game.id, game)}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Excluir"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export const GameTableView: React.FC<{
  games: Game[];
  onSelect: (game: Game) => void;
  onEdit: (game: Game) => void;
  onDelete: (id: string, game?: Game) => void;
}> = ({ games, onSelect, onEdit, onDelete }) => {
  const getDifficultyColor = (diff: GameDifficulty) => {
    switch (diff) {
      case 'Muito Fácil': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Fácil': return 'text-teal-400 bg-teal-500/10 border-teal-500/30';
      case 'Normal': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'Difícil': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Muito Difícil': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              <th className="py-3.5 px-4">Jogo</th>
              <th className="py-3.5 px-4">Plataforma</th>
              <th className="py-3.5 px-4">Gênero</th>
              <th className="py-3.5 px-4">Condição</th>
              <th className="py-3.5 px-4">Nota</th>
              <th className="py-3.5 px-4">Dificuldade</th>
              <th className="py-3.5 px-4">Tempo</th>
              <th className="py-3.5 px-4">Data Zerado</th>
              <th className="py-3.5 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-xs sm:text-sm">
            {games.map((g) => (
              <tr key={g.id} className="hover:bg-zinc-800/40 transition-colors">
                
                {/* Jogo Title & Thumb */}
                <td className="py-3 px-4">
                  <div
                    onClick={() => onSelect(g)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <img
                      src={g.thumbnail}
                      alt={g.title}
                      className="w-9 h-12 rounded-lg object-cover bg-zinc-800 flex-shrink-0 group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div>
                      <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                        {g.title}
                      </h4>
                      {g.releaseYear && (
                        <span className="text-[11px] text-zinc-500">{g.releaseYear}</span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Plataforma */}
                <td className="py-3 px-4 text-zinc-300 font-medium">
                  {g.platform}
                </td>

                {/* Gênero */}
                <td className="py-3 px-4 text-zinc-400">
                  {g.genre}
                </td>

                {/* Condição */}
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-semibold">
                    {g.completionCondition}
                  </span>
                </td>

                {/* Nota */}
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1 font-black text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {g.rating.toFixed(1)}
                  </span>
                </td>

                {/* Dificuldade */}
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${getDifficultyColor(g.difficulty)}`}>
                    {g.difficulty}
                  </span>
                </td>

                {/* Tempo */}
                <td className="py-3 px-4 text-zinc-300 font-bold">
                  {g.hours}h
                </td>

                {/* Data */}
                <td className="py-3 px-4 text-zinc-400 text-xs">
                  {new Date(g.completedDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(g)}
                      className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(g.id, g)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
