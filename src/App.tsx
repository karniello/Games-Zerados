import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Gamepad2, 
  Layers, 
  Trophy, 
  Grid3X3, 
  Calendar, 
  Database, 
  Search, 
  Sparkles,
  Heart
} from 'lucide-react';
import { Game, UserProfile, ActiveTab } from './types';
import { 
  getCurrentUser, 
  setCurrentUser, 
  getGamesForUser, 
  saveGamesForUser 
} from './services/storage';
import { calculateGamification } from './services/gamification';
import { Navbar } from './components/Navbar';
import { AuthScreen } from './components/AuthScreen';
import { GamerProfileBanner } from './components/GamerProfileBanner';
import { BadgesModal } from './components/BadgesModal';
import { FilterBar, FilterState } from './components/FilterBar';
import { GameCard, GameTableView } from './components/GameCard';
import { GameModal } from './components/GameModal';
import { GameDetailsModal } from './components/GameDetailsModal';
import { YearlyStatsTable } from './components/YearlyStatsTable';
import { ScoreDifficultyMatrix } from './components/ScoreDifficultyMatrix';
import { MonthlyStatsView } from './components/MonthlyStatsView';
import { GoalsView } from './components/GoalsView';
import { BackupRestoreModal } from './components/BackupRestoreModal';

export default function App() {
  const [currentUser, setUser] = useState<UserProfile | null>(() => getCurrentUser());
  const [games, setGames] = useState<Game[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('library');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [inspectingGame, setInspectingGame] = useState<Game | null>(null);
  const [isBadgesModalOpen, setIsBadgesModalOpen] = useState(false);

  // Calculate Gamification State (XP, Level, Badges)
  const gamification = useMemo(() => calculateGamification(games), [games]);

  // Filters State for Library Tab
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    platform: '',
    genre: '',
    difficulty: '',
    condition: '',
    minRating: 0,
    year: '',
    sortBy: 'date_desc',
    viewMode: 'grid',
    onlyFavorites: false,
  });

  // Load games when user changes
  useEffect(() => {
    if (currentUser) {
      const userGames = getGamesForUser(currentUser.id);
      setGames(userGames);
    } else {
      setGames([]);
    }
  }, [currentUser]);

  // Persist games whenever changed
  const updateGamesState = (newGames: Game[]) => {
    setGames(newGames);
    if (currentUser) {
      saveGamesForUser(currentUser.id, newGames);
    }
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUser(null);
  };

  // Add or Edit Game handler
  const handleSaveGame = (
    gameData: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    const now = new Date().toISOString();

    if (existingId) {
      // Update
      const updated = games.map((g) => {
        if (g.id === existingId) {
          return {
            ...g,
            ...gameData,
            updatedAt: now,
          };
        }
        return g;
      });
      updateGamesState(updated);
    } else {
      // Create new
      const newGame: Game = {
        ...gameData,
        id: 'game_' + Date.now(),
        createdAt: now,
        updatedAt: now,
      };
      updateGamesState([newGame, ...games]);
    }
  };

  const handleDeleteGame = (id: string) => {
    const updated = games.filter((g) => g.id !== id);
    updateGamesState(updated);
    if (inspectingGame?.id === id) setInspectingGame(null);
  };

  const handleToggleFavorite = (id: string) => {
    const updated = games.map((g) => {
      if (g.id === id) {
        return { ...g, favorite: !g.favorite };
      }
      return g;
    });
    updateGamesState(updated);
  };

  // Restore games from backup handler
  const handleRestoreGames = (restoredGames: Game[]) => {
    updateGamesState(restoredGames);
  };

  // If not logged in, render AuthScreen
  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Filter and sort games for Library
  const availableYears = Array.from(
    new Set(
      games
        .map((g) => g.completedDate?.substring(0, 4))
        .filter((y): y is string => !!y && y.length === 4)
    )
  ).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));

  const filteredGames = games
    .filter((g) => {
      // Search text
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesTitle = g.title.toLowerCase().includes(query);
        const matchesGenre = g.genre.toLowerCase().includes(query);
        const matchesDev = (g.developer || '').toLowerCase().includes(query);
        const matchesPlatform = g.platform.toLowerCase().includes(query);
        if (!matchesTitle && !matchesGenre && !matchesDev && !matchesPlatform) {
          return false;
        }
      }

      // Platform
      if (filters.platform && g.platform !== filters.platform) {
        return false;
      }

      // Genre
      if (filters.genre && g.genre !== filters.genre) {
        return false;
      }

      // Difficulty
      if (filters.difficulty && g.difficulty !== filters.difficulty) {
        return false;
      }

      // Condition
      if (filters.condition && g.completionCondition !== filters.condition) {
        return false;
      }

      // Rating
      if (filters.minRating > 0 && g.rating < filters.minRating) {
        return false;
      }

      // Year
      if (filters.year && !g.completedDate.startsWith(filters.year)) {
        return false;
      }

      // Favorites only
      if (filters.onlyFavorites && !g.favorite) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'date_desc':
          return (b.completedDate || '').localeCompare(a.completedDate || '');
        case 'date_asc':
          return (a.completedDate || '').localeCompare(b.completedDate || '');
        case 'rating_desc':
          return b.rating - a.rating;
        case 'rating_asc':
          return a.rating - b.rating;
        case 'hours_desc':
          return b.hours - a.hours;
        case 'hours_asc':
          return a.hours - b.hours;
        case 'title_asc':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => {
          setEditingGame(null);
          setIsAddModalOpen(true);
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        totalGames={games.length}
        playerLevel={gamification.currentLevel.level}
        playerBadgeIcon={gamification.currentLevel.badgeIcon}
        onOpenBadgesModal={() => setIsBadgesModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Tab 1: Library */}
        {activeTab === 'library' && (
          <div className="space-y-6">
            
            {/* Gamified Profile Banner with Level, XP & Badges Showcase */}
            <GamerProfileBanner
              currentUser={currentUser}
              gamification={gamification}
              onOpenBadgesModal={() => setIsBadgesModalOpen(true)}
            />

            {/* Filter Bar */}
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              totalMatches={filteredGames.length}
              totalGames={games.length}
              availableYears={availableYears}
            />

            {/* Games Collection Display */}
            {filteredGames.length === 0 ? (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-3xl bg-zinc-800 flex items-center justify-center text-zinc-500 mb-4">
                  <Gamepad2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Nenhum jogo encontrado
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto mb-6">
                  {games.length === 0
                    ? 'Você ainda não cadastrou nenhum jogo zerado. Comece adicionando seu primeiro jogo ou importando direto da internet!'
                    : 'Nenhum jogo corresponde aos filtros selecionados. Tente ajustar a busca.'}
                </p>
                <button
                  onClick={() => {
                    setEditingGame(null);
                    setIsAddModalOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Primeiro Jogo Zerado</span>
                </button>
              </div>
            ) : filters.viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
                {filteredGames.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    onSelect={(g) => setInspectingGame(g)}
                    onEdit={(g) => {
                      setEditingGame(g);
                      setIsAddModalOpen(true);
                    }}
                    onDelete={handleDeleteGame}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <GameTableView
                games={filteredGames}
                onSelect={(g) => setInspectingGame(g)}
                onEdit={(g) => {
                  setEditingGame(g);
                  setIsAddModalOpen(true);
                }}
                onDelete={handleDeleteGame}
              />
            )}

          </div>
        )}

        {/* Tab 2: Yearly Stats Table */}
        {activeTab === 'yearly' && (
          <YearlyStatsTable
            games={games}
            currentUser={currentUser}
            onSelectGame={(g) => setInspectingGame(g)}
          />
        )}

        {/* Tab 3: Score & Difficulty Matrix */}
        {activeTab === 'matrix' && (
          <ScoreDifficultyMatrix
            games={games}
            onSelectGame={(g) => setInspectingGame(g)}
          />
        )}

        {/* Tab 4: Monthly Stats View */}
        {activeTab === 'monthly' && (
          <MonthlyStatsView
            games={games}
            currentUser={currentUser}
            onSelectGame={(g) => setInspectingGame(g)}
          />
        )}

        {/* Tab 5: Goals (Metas de Zeramento) */}
        {activeTab === 'goals' && (
          <GoalsView
            games={games}
            currentUser={currentUser}
            onSelectGame={(g) => setInspectingGame(g)}
            onOpenAddModalWithTitle={(title, platform) => {
              setEditingGame({
                id: '',
                title,
                thumbnail: '',
                platform: platform || 'PlayStation 5',
                genre: 'Ação',
                completionCondition: 'História Principal',
                rating: 9.0,
                difficulty: 'Normal',
                hours: 20,
                completedDate: new Date().toISOString().split('T')[0],
                createdAt: '',
                updatedAt: '',
              });
              setIsAddModalOpen(true);
            }}
          />
        )}

        {/* Tab 6: Backup & Restore */}
        {activeTab === 'backup' && (
          <BackupRestoreModal
            games={games}
            currentUser={currentUser}
            onRestoreGames={handleRestoreGames}
          />
        )}

      </main>

      {/* Floating Action Button for Quick Add on Mobile */}
      <div className="fixed bottom-5 right-5 sm:hidden z-30">
        <button
          onClick={() => {
            setEditingGame(null);
            setIsAddModalOpen(true);
          }}
          className="w-14 h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl shadow-purple-600/40 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      {/* Add / Edit Game Modal */}
      <GameModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingGame(null);
        }}
        onSave={handleSaveGame}
        initialGame={editingGame}
      />

      {/* Inspect Game Details Modal */}
      <GameDetailsModal
        isOpen={!!inspectingGame}
        game={inspectingGame}
        onClose={() => setInspectingGame(null)}
        onEdit={(g) => {
          setEditingGame(g);
          setIsAddModalOpen(true);
        }}
        onDelete={handleDeleteGame}
      />

      {/* Badges & Achievements Modal */}
      <BadgesModal
        isOpen={isBadgesModalOpen}
        onClose={() => setIsBadgesModalOpen(false)}
        gamification={gamification}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/80 py-6 mt-12 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-zinc-400">GameVault</span>
            <span>• Diário de Jogos Zerados</span>
          </div>
          <p className="text-[11px] text-zinc-500">
            Importação inteligente via internet • Estatísticas completas • Backup local seguro
          </p>
        </div>
      </footer>

    </div>
  );
}
