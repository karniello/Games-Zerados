import React from 'react';
import { 
  Search, 
  Filter, 
  LayoutGrid, 
  Table as TableIcon, 
  X, 
  ArrowUpDown,
  Sparkles
} from 'lucide-react';
import { PLATFORMS, GENRES, DIFFICULTIES, COMPLETION_CONDITIONS } from '../constants/initialData';
import { GameDifficulty, CompletionCondition } from '../types';

export interface FilterState {
  search: string;
  platform: string;
  genre: string;
  difficulty: string;
  condition: string;
  minRating: number;
  year: string;
  sortBy: 'date_desc' | 'date_asc' | 'rating_desc' | 'rating_asc' | 'hours_desc' | 'hours_asc' | 'title_asc';
  viewMode: 'grid' | 'table';
  onlyFavorites: boolean;
}

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  totalMatches: number;
  totalGames: number;
  availableYears: string[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  totalMatches,
  totalGames,
  availableYears,
}) => {
  const hasActiveFilters = 
    filters.search !== '' ||
    filters.platform !== '' ||
    filters.genre !== '' ||
    filters.difficulty !== '' ||
    filters.condition !== '' ||
    filters.minRating > 0 ||
    filters.year !== '' ||
    filters.onlyFavorites;

  const resetFilters = () => {
    setFilters((prev) => ({
      ...prev,
      search: '',
      platform: '',
      genre: '',
      difficulty: '',
      condition: '',
      minRating: 0,
      year: '',
      onlyFavorites: false,
    }));
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-lg space-y-4">
      
      {/* Top Search & View Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
            placeholder="Buscar por título, gênero, estúdio..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => setFilters((p) => ({ ...p, search: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort & View Mode */}
        <div className="flex items-center gap-2">
          
          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-2xl text-xs text-zinc-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((p) => ({ ...p, sortBy: e.target.value as any }))}
              className="bg-transparent border-none text-zinc-200 focus:outline-none cursor-pointer text-xs"
            >
              <option value="date_desc">Mais Recentes</option>
              <option value="date_asc">Mais Antigos</option>
              <option value="rating_desc">Maior Nota</option>
              <option value="rating_asc">Menor Nota</option>
              <option value="hours_desc">Mais Horas</option>
              <option value="hours_asc">Menos Horas</option>
              <option value="title_asc">Título (A-Z)</option>
            </select>
          </div>

          {/* Grid vs Table View Mode */}
          <div className="flex items-center bg-zinc-950 border border-zinc-800 p-1 rounded-2xl">
            <button
              onClick={() => setFilters((p) => ({ ...p, viewMode: 'grid' }))}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                filters.viewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Visualização em Grade de Cartazes"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFilters((p) => ({ ...p, viewMode: 'table' }))}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                filters.viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Visualização em Tabela Detalhada"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Dropdown Filters Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
        
        {/* Platform */}
        <select
          value={filters.platform}
          onChange={(e) => setFilters((p) => ({ ...p, platform: e.target.value }))}
          className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer truncate"
        >
          <option value="">Todas as Plataformas</option>
          {PLATFORMS.map((plat) => (
            <option key={plat} value={plat}>{plat}</option>
          ))}
        </select>

        {/* Genre */}
        <select
          value={filters.genre}
          onChange={(e) => setFilters((p) => ({ ...p, genre: e.target.value }))}
          className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer truncate"
        >
          <option value="">Todos os Gêneros</option>
          {GENRES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        {/* Difficulty */}
        <select
          value={filters.difficulty}
          onChange={(e) => setFilters((p) => ({ ...p, difficulty: e.target.value }))}
          className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer truncate"
        >
          <option value="">Todas as Dificuldades</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* Condition */}
        <select
          value={filters.condition}
          onChange={(e) => setFilters((p) => ({ ...p, condition: e.target.value }))}
          className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer truncate"
        >
          <option value="">Todas as Condições</option>
          {COMPLETION_CONDITIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Year */}
        <select
          value={filters.year}
          onChange={(e) => setFilters((p) => ({ ...p, year: e.target.value }))}
          className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer truncate"
        >
          <option value="">Todos os Anos</option>
          {availableYears.map((yr) => (
            <option key={yr} value={yr}>{yr}</option>
          ))}
        </select>

        {/* Min Rating */}
        <select
          value={filters.minRating}
          onChange={(e) => setFilters((p) => ({ ...p, minRating: parseFloat(e.target.value) }))}
          className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer truncate"
        >
          <option value={0}>Todas as Notas</option>
          <option value={9.5}>★ 9.5+ (Excelentes)</option>
          <option value={9.0}>★ 9.0+ (Muito Bons)</option>
          <option value={8.0}>★ 8.0+ (Bons)</option>
          <option value={7.0}>★ 7.0+ (Razoáveis)</option>
        </select>

      </div>

      {/* Filter status bar with favorites button */}
      <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-zinc-800/80 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span>Exibindo <strong>{totalMatches}</strong> de <strong>{totalGames}</strong> jogos zerados</span>
          
          <button
            onClick={() => setFilters((p) => ({ ...p, onlyFavorites: !p.onlyFavorites }))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              filters.onlyFavorites
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>♥ Apenas Favoritos</span>
          </button>
        </div>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpar filtros</span>
          </button>
        )}
      </div>

    </div>
  );
};
