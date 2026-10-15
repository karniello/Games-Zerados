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
  Heart,
  PenLine,
  MessageSquareQuote
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Game, GameDifficulty, CompletionCondition } from '../types';
import { PLATFORMS, GENRES, COMPLETION_CONDITIONS, DIFFICULTIES } from '../constants/initialData';
import { searchGamesOnline, fetchGameSynopsis, fetchSearchStatus, GameSearchResult, SearchStatus } from '../services/api';

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
  const [searchStatus, setSearchStatus] = useState<SearchStatus | null>(null);
  const [preferredProvider, setPreferredProvider] = useState<'auto' | 'rawg' | 'igdb'>('auto');

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

  const handleInsertPrompt = (promptLabel: string) => {
    if (!notes.trim()) {
      setNotes(`[${promptLabel}]: `);
    } else {
      setNotes((prev) => `${prev.trim()}\n\n[${promptLabel}]: `);
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

  useEffect(() => {
    if (isOpen) {
      fetchSearchStatus().then(setSearchStatus);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearchOnline = async (e?: React.FormEvent, directTerm?: string) => {
    if (e) e.preventDefault();
    const term = (directTerm !== undefined ? directTerm : searchQuery).trim();
    if (!term) return;

    if (directTerm !== undefined) {
      setSearchQuery(directTerm);
    }

    setIsSearching(true);
    setSearchFeedback(null);
    try {
      const results = await searchGamesOnline(term, preferredProvider);
      setSearchResults(results);
      if (results.length === 0) {
        setSearchFeedback('Nenhum resultado encontrado. Você pode preencher os campos manualmente.');
      } else {
        const topSource = results[0]?.source;
        const sourceLabel = topSource === 'rawg'
          ? 'RAWG API'
          : topSource === 'igdb'
          ? 'IGDB API'
          : topSource === 'steam'
          ? 'Steam Store'
          : topSource === 'curated_database'
          ? 'Catálogo Curado'
          : 'Web / IA';

        setSearchFeedback(`${results.length} resultado(s) encontrado(s) via ${sourceLabel}. Clique em um jogo para puxar os dados.`);
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
    setSearchFeedback(`✅ Metadados de "${res.title}" aplicados com sucesso! Capa, ano, estúdio e plataforma preenchidos.`);
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

          {/* Section: Import Direct from Internet (RAWG / IGDB / Steam) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-zinc-900 border border-indigo-500/30">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Buscar no Catálogo Online (IGDB / RAWG)
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold border flex items-center gap-1 ${
                  searchStatus?.rawgConfigured
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  RAWG {searchStatus?.rawgConfigured ? '✓' : ''}
                </span>
                <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold border flex items-center gap-1 ${
                  searchStatus?.igdbConfigured
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  IGDB {searchStatus?.igdbConfigured ? '✓' : ''}
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 mb-3">
              Digite o nome de qualquer jogo para buscar capa de alta qualidade, estúdio desenvolvedor, ano de lançamento, gênero e sinopse:
            </p>

            <form onSubmit={(e) => handleSearchOnline(e)} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ex: Elden Ring, The Witcher 3, Hollow Knight, God of War..."
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {(searchStatus?.rawgConfigured || searchStatus?.igdbConfigured) && (
                <select
                  value={preferredProvider}
                  onChange={(e) => setPreferredProvider(e.target.value as any)}
                  className="bg-zinc-950 border border-zinc-700/80 rounded-xl px-2.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="auto">Automático (Mais rápido)</option>
                  {searchStatus?.rawgConfigured && <option value="rawg">RAWG API</option>}
                  {searchStatus?.igdbConfigured && <option value="igdb">IGDB API</option>}
                </select>
              )}

              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-indigo-600/20"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Buscando...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Buscar Jogo</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Suggestions Pills */}
            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-zinc-400 font-medium">Exemplos rápidos:</span>
              {['Elden Ring', 'The Witcher 3', 'Hollow Knight', 'God of War', 'Baldur\'s Gate 3', 'Cyberpunk 2077'].map((gameName) => (
                <button
                  key={gameName}
                  type="button"
                  onClick={() => handleSearchOnline(undefined, gameName)}
                  disabled={isSearching}
                  className="px-2 py-0.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 text-[10px] text-zinc-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {gameName}
                </button>
              ))}
            </div>

            {searchFeedback && (
              <p className="text-xs text-indigo-300 mt-2.5 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <span>{searchFeedback}</span>
              </p>
            )}

            {/* Search Results Grid */}
            {searchResults.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                {searchResults.map((result, idx) => {
                  const source = result.source || 'web';
                  let sourceBadge = (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                      Web
                    </span>
                  );
                  if (source === 'rawg') {
                    sourceBadge = (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        RAWG API
                      </span>
                    );
                  } else if (source === 'igdb') {
                    sourceBadge = (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        IGDB API
                      </span>
                    );
                  } else if (source === 'steam') {
                    sourceBadge = (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        Steam
                      </span>
                    );
                  } else if (source === 'curated_database') {
                    sourceBadge = (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Catálogo Curado
                      </span>
                    );
                  } else if (source === 'gemini') {
                    sourceBadge = (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                        Gemini AI
                      </span>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      onClick={() => applySearchResult(result)}
                      className="flex gap-3 p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-indigo-500 hover:bg-indigo-950/20 transition-all cursor-pointer group text-left"
                    >
                      <img
                        src={result.thumbnail}
                        alt={result.title}
                        className="w-16 h-20 rounded-lg object-cover bg-zinc-800 flex-shrink-0 group-hover:scale-105 transition-transform shadow-md"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-300">
                              {result.title}
                            </h4>
                            {sourceBadge}
                          </div>
                          <p className="text-[11px] text-zinc-400">
                            {result.releaseYear ? `${result.releaseYear} • ` : ''}{result.developer || 'Estúdio'}
                          </p>
                          {result.genres && result.genres.length > 0 && (
                            <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                              {result.genres.slice(0, 2).join(', ')}
                            </p>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] text-indigo-400 font-semibold group-hover:underline mt-1">
                          <Check className="w-3 h-3" /> Usar estes dados no formulário
                        </span>
                      </div>
                    </div>
                  );
                })}
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
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/25 via-zinc-950 to-zinc-950 border border-purple-500/30 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-purple-400" />
                  <label className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                    Notas & Review Pessoal (Memórias do Zeramento)
                  </label>
                </div>
                {notes.trim().length > 0 && (
                  <span className="text-[11px] font-medium text-zinc-400 bg-zinc-900/90 px-2 py-0.5 rounded-lg border border-zinc-800">
                    {notes.trim().split(/\s+/).filter(Boolean).length} palavras • {notes.length} caracteres
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-400">
                Documente suas impressões, memórias marcantes, como foi a batalha final, platina ou o que achou da experiência:
              </p>

              {/* Memory Prompts Inspirations */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                  Ideias para registrar:
                </span>
                {[
                  { label: '🌟 Momento Inesquecível', prefix: 'Momento Inesquecível' },
                  { label: '⚔️ Chefe Mais Marcante', prefix: 'Chefe Mais Marcante' },
                  { label: '🎵 Trilha Sonora & Arte', prefix: 'Trilha Sonora & Arte' },
                  { label: '🏆 Desafio / Platina', prefix: 'Desafio para Zerar' },
                  { label: '💬 Veredito Final', prefix: 'Veredito' },
                ].map((item) => (
                  <button
                    key={item.prefix}
                    type="button"
                    onClick={() => handleInsertPrompt(item.prefix)}
                    className="px-2 py-0.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-[10px] text-purple-200 hover:text-white transition-colors cursor-pointer"
                    title={`Inserir "[${item.prefix}]" na sua análise`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Escreva aqui sua resenha pessoal: o que mais te surpreendeu, pontos fortes, se teve alguma parte frustrante, memórias de quando zerou ou conselhos para quem vai jogar..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors leading-relaxed resize-y min-h-[96px]"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>Esta resenha pessoal fica salva no seu histórico e nos relatórios exportados em PDF e Excel.</span>
                {notes.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => setNotes('')}
                    className="text-[10px] text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer ml-2 flex-shrink-0"
                  >
                    Limpar
                  </button>
                )}
              </div>
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
