import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Sparkles, 
  Globe, 
  Gamepad2, 
  Calendar, 
  Clock, 
  Star, 
  Award, 
  Sliders, 
  Image as ImageIcon, 
  Loader2, 
  Check, 
  ExternalLink,
  Heart
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Game, GameDifficulty, CompletionCondition } from '../types';
import { PLATFORMS, GENRES, COMPLETION_CONDITIONS, DIFFICULTIES } from '../constants/initialData';
import { searchGamesOnline, fetchGameSynopsis, GameSearchResult } from '../services/api';

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (game: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => void;
  initialGame?: Game | null;
}

export const GameModal: React.FC<GameModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialGame,
}) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GameSearchResult[]>([]);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [genre, setGenre] = useState(GENRES[0]);
  const [completionCondition, setCompletionCondition] = useState<CompletionCondition>(COMPLETION_CONDITIONS[0]);
  const [rating, setRating] = useState<number>(9.0);
  const [difficulty, setDifficulty] = useState<GameDifficulty>('Normal');
  const [hours, setHours] = useState<number>(20);
  const [completedDate, setCompletedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [releaseYear, setReleaseYear] = useState<number | undefined>(new Date().getFullYear());
  const [developer, setDeveloper] = useState('');
  const [publisher, setPublisher] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [notes, setNotes] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [isFetchingSynopsis, setIsFetchingSynopsis] = useState(false);

  const handleAutoFetchSynopsis = async () => {
    if (!title.trim()) return;
    setIsFetchingSynopsis(true);
    try {
      const data = await fetchGameSynopsis(title.trim());
      if (data.synopsis) {
        setSynopsis(data.synopsis);
      }
      if (!developer && data.developer) {
        setDeveloper(data.developer);
      }
      if (!releaseYear && data.releaseYear) {
        setReleaseYear(data.releaseYear);
      }
      if (data.genres && data.genres.length > 0) {
        const matched = GENRES.find((g) =>
          data.genres?.some((dg) => dg.toLowerCase().includes(g.toLowerCase()) || g.toLowerCase().includes(dg.toLowerCase()))
        );
        if (matched) setGenre(matched);
      }
      setSearchFeedback('Resumo e detalhes puxados com sucesso!');
    } catch {
      setSearchFeedback('Não foi possível buscar a sinopse automaticamente.');
    } finally {
      setIsFetchingSynopsis(false);
    }
  };

  useEffect(() => {
    if (initialGame) {
      setTitle(initialGame.title || '');
      setThumbnail(initialGame.thumbnail || '');
      setPlatform(initialGame.platform || PLATFORMS[0]);
      setGenre(initialGame.genre || GENRES[0]);
      setCompletionCondition(initialGame.completionCondition || COMPLETION_CONDITIONS[0]);
      setRating(initialGame.rating ?? 8.0);
      setDifficulty(initialGame.difficulty || 'Normal');
      setHours(initialGame.hours ?? 15);
      setCompletedDate(initialGame.completedDate || new Date().toISOString().split('T')[0]);
      setReleaseYear(initialGame.releaseYear);
      setDeveloper(initialGame.developer || '');
      setPublisher(initialGame.publisher || '');
      setSynopsis(initialGame.synopsis || '');
      setNotes(initialGame.notes || '');
      setFavorite(!!initialGame.favorite);
    } else {
      // Reset
      setTitle('');
      setThumbnail('');
      setPlatform(PLATFORMS[0]);
      setGenre(GENRES[0]);
      setCompletionCondition(COMPLETION_CONDITIONS[0]);
      setRating(9.0);
      setDifficulty('Normal');
      setHours(20);
      setCompletedDate(new Date().toISOString().split('T')[0]);
      setReleaseYear(new Date().getFullYear());
      setDeveloper('');
      setPublisher('');
      setSynopsis('');
      setNotes('');
      setFavorite(false);
      setSearchResults([]);
      setSearchQuery('');
      setSearchFeedback(null);
    }
  }, [initialGame, isOpen]);

  if (!isOpen) return null;

  const handleSearchOnline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchFeedback(null);
    try {
      const results = await searchGamesOnline(searchQuery.trim());
      setSearchResults(results);
      if (results.length === 0) {
        setSearchFeedback('Nenhum resultado encontrado. Você pode preencher os campos manualmente.');
      } else {
        setSearchFeedback(`${results.length} sugestão(ões) encontrada(s) na internet.`);
      }
    } catch {
      setSearchFeedback('Falha na busca online. Preencha manualmente.');
    } finally {
      setIsSearching(false);
    }
  };

  const applySearchResult = (res: GameSearchResult) => {
    setTitle(res.title);
    if (res.thumbnail) setThumbnail(res.thumbnail);
    if (res.releaseYear) setReleaseYear(res.releaseYear);
    if (res.developer) setDeveloper(res.developer);
    if (res.publisher) setPublisher(res.publisher);
    if (res.synopsis) setSynopsis(res.synopsis);

    // Auto map genre
    if (res.genres && res.genres.length > 0) {
      const matched = GENRES.find((g) =>
        res.genres?.some((rg) => rg.toLowerCase().includes(g.toLowerCase()) || g.toLowerCase().includes(rg.toLowerCase()))
      );
      if (matched) setGenre(matched);
      else setGenre(res.genres[0]);
    }

    // Auto map platform
    if (res.platforms && res.platforms.length > 0) {
      const matchedPlat = PLATFORMS.find((p) =>
        res.platforms?.some((rp) => rp.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(rp.toLowerCase()))
      );
      if (matchedPlat) setPlatform(matchedPlat);
    }

    if (res.averageHours) {
      setHours(Math.round(res.averageHours));
    }

    setSearchResults([]);
    setSearchFeedback(`Dados importados de "${res.title}" com sucesso!`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Fire joyful confetti if 10 or 100% / Platina!
    if (rating === 10 || completionCondition.includes('Platina') || completionCondition.includes('100%')) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    onSave(
      {
        title: title.trim(),
        thumbnail: thumbnail.trim() || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
        platform,
        genre,
        completionCondition,
        rating: Number(rating),
        difficulty,
        hours: Math.max(0, Number(hours)),
        completedDate,
        releaseYear: releaseYear ? Number(releaseYear) : undefined,
        developer: developer.trim() || undefined,
        publisher: publisher.trim() || undefined,
        synopsis: synopsis.trim() || undefined,
        notes: notes.trim() || undefined,
        favorite,
      },
      initialGame?.id
    );

    onClose();
  };

  const getDifficultyColor = (diff: GameDifficulty) => {
    switch (diff) {
      case 'Muito Fácil': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Fácil': return 'text-teal-400 bg-teal-500/10 border-teal-500/30';
      case 'Normal': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'Difícil': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Muito Difícil': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default: return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {initialGame ? 'Editar Jogo Zerado' : 'Cadastrar Jogo Zerado'}
              </h2>
              <p className="text-xs text-zinc-400">
                Preencha as informações ou importe os detalhes direto da internet
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

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">

          {/* Section: Import Direct from Internet */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-zinc-900 border border-indigo-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Importar Dados Direto da Internet
              </h3>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-indigo-500/20 text-indigo-300 font-semibold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Busca Inteligente
              </span>
            </div>
            <p className="text-xs text-zinc-400 mb-3">
              Digite o nome do jogo (ex: <em>Elden Ring, God of War, Zelda, Cyberpunk</em>) para puxar capa, desenvolvedora, ano e gênero automaticamente:
            </p>

            <form onSubmit={handleSearchOnline} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nome do jogo..."
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Buscando...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Buscar na Web</span>
                  </>
                )}
              </button>
            </form>

            {searchFeedback && (
              <p className="text-xs text-indigo-300 mt-2 font-medium">{searchFeedback}</p>
            )}

            {/* Search Results Grid */}
            {searchResults.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                {searchResults.map((result, idx) => (
                  <div
                    key={idx}
                    onClick={() => applySearchResult(result)}
                    className="flex gap-3 p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-indigo-500 hover:bg-indigo-950/20 transition-all cursor-pointer group text-left"
                  >
                    <img
                      src={result.thumbnail}
                      alt={result.title}
                      className="w-14 h-18 rounded-lg object-cover bg-zinc-800 flex-shrink-0 group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-300">
                        {result.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {result.releaseYear} • {result.developer || 'Estúdio'}
                      </p>
                      {result.genres && (
                        <p className="text-[10px] text-zinc-500 truncate mt-1">
                          {result.genres.slice(0, 2).join(', ')}
                        </p>
                      )}
                      <span className="inline-flex items-center gap-1 text-[10px] text-indigo-400 font-semibold mt-1">
                        <Check className="w-3 h-3" /> Usar estes dados
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form */}
          <form id="game-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Row 1: Title and Favorite */}
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Título do Jogo *
                  </label>
                  {title.trim() && (
                    <button
                      type="button"
                      onClick={handleAutoFetchSynopsis}
                      disabled={isFetchingSynopsis}
                      className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                      title="Puxa o resumo e dados automaticamente"
                    >
                      {isFetchingSynopsis ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Puxando resumo...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>Puxar Resumo Automático</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Elden Ring"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <div className="pt-7">
                <button
                  type="button"
                  onClick={() => setFavorite(!favorite)}
                  className={`p-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    favorite
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title={favorite ? 'Remover dos favoritos' : 'Favoritar jogo'}
                >
                  <Heart className={`w-4 h-4 ${favorite ? 'fill-rose-400 text-rose-400' : ''}`} />
                  <span className="hidden sm:inline">Favorito</span>
                </button>
              </div>
            </div>

            {/* Row 2: Thumbnail URL & Live Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start">
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  URL da Capa / Thumbnail (ou importada da web)
                </label>
                <div className="relative">
                  <ImageIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                    placeholder="https://... capa do jogo"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Dica: A busca na internet preenche este campo automaticamente com a arte oficial.
                </p>
              </div>

              <div className="sm:col-span-1 flex flex-col items-center justify-center">
                <span className="text-[11px] text-zinc-400 mb-1">Pré-visualização</span>
                <div className="w-18 h-24 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center relative shadow-inner">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt="Capa"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80';
                      }}
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-zinc-700" />
                  )}
                </div>
              </div>
            </div>

            {/* Row 3: Console / Plataforma & Gênero */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Tipo de Console / Plataforma *
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Gênero do Jogo *
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  {GENRES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 4: Condição de Zeramento & Nível de Dificuldade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Condição de Zeramento *
                </label>
                <select
                  value={completionCondition}
                  onChange={(e) => setCompletionCondition(e.target.value as CompletionCondition)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  {COMPLETION_CONDITIONS.map((cond) => (
                    <option key={cond} value={cond}>{cond}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Nível de Dificuldade *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {DIFFICULTIES.map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`px-2 py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        difficulty === diff
                          ? getDifficultyColor(diff) + ' ring-1 ring-current'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 5: Nota (0 a 10) & Tempo em Horas & Data de Conclusão */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Rating 0-10 */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Nota do Jogo (0 a 10) *
                  </label>
                  <span className="text-sm font-black px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    ★ {rating.toFixed(1)} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={rating}
                  onChange={(e) => setRating(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 px-1 mt-1">
                  <span>0 (Ruim)</span>
                  <span>5 (Médio)</span>
                  <span>10 (Obra-Prima)</span>
                </div>
              </div>

              {/* Playtime in Hours */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Tempo Jogado (Horas) *
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={hours}
                    onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
                    placeholder="25"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Completion Date */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Data de Conclusão *
                  </label>
                  <button
                    type="button"
                    onClick={() => setCompletedDate(new Date().toISOString().split('T')[0])}
                    className="text-[10px] text-indigo-400 hover:underline"
                  >
                    Hoje
                  </button>
                </div>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={completedDate}
                    onChange={(e) => setCompletedDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Row 6: Extras - Release Year and Developer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Ano de Lançamento
                </label>
                <input
                  type="number"
                  min="1970"
                  max="2035"
                  value={releaseYear || ''}
                  onChange={(e) => setReleaseYear(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  placeholder="2023"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Desenvolvedora / Estúdio
                </label>
                <input
                  type="text"
                  value={developer}
                  onChange={(e) => setDeveloper(e.target.value)}
                  placeholder="Ex: FromSoftware, Capcom, Naughty Dog"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Row 7: Synopsis / Game Summary */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/30 via-zinc-950 to-zinc-950 border border-indigo-500/20 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Resumo Oficial / Sinopse do Jogo</span>
                  </label>
                  {synopsis && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> Puxado da Web
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAutoFetchSynopsis}
                  disabled={isFetchingSynopsis || !title.trim()}
                  className="text-xs font-bold px-3 py-1 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  title="Puxa ou gera um resumo automático na internet baseado no título do jogo"
                >
                  {isFetchingSynopsis ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Buscando Resumo...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Puxar Resumo Automático</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                rows={3}
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="A sinopse e enredo principal do jogo aparecerão aqui automaticamente ao buscar ou clicar no botão acima..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
              />
              <p className="text-[11px] text-zinc-500">
                Este resumo é puxado direto da internet e fica registrado nos detalhes do jogo e relatórios.
              </p>
            </div>

            {/* Row 8: Personal Review & Notes */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Anotações Pessoais & Review do que achou
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="O que achou dos chefes, história, platina, jogabilidade, momentos marcantes..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>

          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-end gap-3 sticky bottom-0 z-20 backdrop-blur-md">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="game-form"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/30 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{initialGame ? 'Salvar Alterações' : 'Cadastrar Jogo Zerado'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
