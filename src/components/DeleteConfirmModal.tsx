import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, Star, Clock } from 'lucide-react';
import { Game } from '../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  game: Game | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  game,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !game) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
          <Trash2 className="w-6 h-6" />
        </div>

        {/* Title & Warning */}
        <h3 className="text-lg font-bold text-white mb-1.5">
          Excluir Jogo da Coleção?
        </h3>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-4">
          Tem certeza que deseja remover permanentemente este jogo do seu diário de zerados? Esta ação não pode ser desfeita.
        </p>

        {/* Game Preview Card */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 mb-6">
          <img
            src={game.thumbnail}
            alt={game.title}
            className="w-14 h-18 rounded-xl object-cover bg-zinc-800 flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80';
            }}
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white truncate">
              {game.title}
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              {game.platform} • {game.genre}
            </p>
            <div className="flex items-center gap-3 mt-1.5 text-xs">
              <span className="flex items-center gap-1 font-bold text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {game.rating.toFixed(1)}
              </span>
              <span className="flex items-center gap-1 text-zinc-400 font-medium">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                {game.hours}h
              </span>
            </div>
          </div>
        </div>

        {/* Warning Alert Note */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-950/20 border border-red-500/20 text-red-300 text-xs mb-6">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <span>Suas notas, histórico de horas e estatísticas relacionadas a este jogo serão removidos.</span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-red-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Excluindo...' : 'Sim, Excluir Jogo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
