import React from 'react';
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
  MessageSquareQuote
} from 'lucide-react';
import { Game } from '../types';

interface GameDetailsModalProps {
  game: Game | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (game: Game) => void;
  onDelete: (id: string) => void;
}

export const GameDetailsModal: React.FC<GameDetailsModalProps> = ({
  game,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !game) return null;

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

  const formattedDate = new Date(game.completedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Background Ambient Banner */}
        <div className="relative h-48 sm:h-60 overflow-hidden bg-zinc-950">
          <img
            src={game.thumbnail}
            alt={game.title}
            className="w-full h-full object-cover blur-md opacity-35 scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Poster and Title Header */}
          <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
            <img
              src={game.thumbnail}
              alt={game.title}
              className="w-24 sm:w-28 h-32 sm:h-38 rounded-2xl object-cover shadow-2xl ring-2 ring-white/20 bg-zinc-800 flex-shrink-0"
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
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight truncate">
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

        {/* Details Body */}
        <div className="p-5 sm:p-6 space-y-6">
          
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

        {/* Modal Actions */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/70 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm(`Tem certeza que deseja excluir "${game.title}" da sua lista de zerados?`)) {
                onDelete(game.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
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
              <span>Editar</span>
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
