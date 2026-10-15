import React from 'react';
import { 
  Gamepad2, 
  Plus, 
  BarChart3, 
  Calendar, 
  Layers, 
  Grid3X3, 
  Database, 
  LogOut, 
  Trophy,
  Sparkles,
  Target,
  TrendingUp,
  User
} from 'lucide-react';
import { ActiveTab, UserProfile } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddModal: () => void;
  currentUser: UserProfile;
  onLogout: () => void;
  totalGames: number;
  playerLevel?: number;
  playerBadgeIcon?: string;
  onOpenBadgesModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  currentUser,
  onLogout,
  totalGames,
  playerLevel,
  playerBadgeIcon,
  onOpenBadgesModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setActiveTab('library')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 ring-1 ring-white/20">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-zinc-400">
                  GameVault
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium hidden sm:inline-block">
                  Zerados
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">Diário de Jogos Zerados</p>
            </div>
          </div>

          {/* Navigation Links Desktop */}
          <nav className="hidden md:flex items-center gap-1 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/80">
            <button
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'library'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Biblioteca ({totalGames})</span>
            </button>

            <button
              onClick={() => setActiveTab('yearly')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'yearly'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Por Ano & Total</span>
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'matrix'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Notas & Dificuldade</span>
            </button>

            <button
              onClick={() => setActiveTab('monthly')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'monthly'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Por Mês</span>
            </button>

            <button
              onClick={() => setActiveTab('goals')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'goals'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Metas</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('backup')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'backup'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Backup</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Área do Usuário</span>
            </button>
          </nav>

          {/* Actions & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Cadastrar Jogo</span>
              <span className="sm:hidden">Adicionar</span>
            </button>

            {/* User Info & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
              <div className="relative group">
                <div 
                  onClick={() => setActiveTab('profile')}
                  className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-zinc-900 transition-colors cursor-pointer"
                  title="Abrir Área do Usuário e Conexões"
                >
                  <div className="relative">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-full bg-zinc-800 ring-2 ring-purple-500/40 object-cover"
                    />
                    {playerLevel && (
                      <span className="absolute -bottom-1 -right-1 px-1 py-0.2 text-[9px] font-black rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black leading-tight ring-1 ring-zinc-950 shadow">
                        {playerLevel}
                      </span>
                    )}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-bold text-zinc-200 leading-none flex items-center gap-1">
                      <span>{currentUser.name}</span>
                      {playerBadgeIcon && <span className="text-[10px]">{playerBadgeIcon}</span>}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{currentUser.gamerTag}</p>
                  </div>
                </div>
              </div>

              {onOpenBadgesModal && (
                <button
                  onClick={onOpenBadgesModal}
                  title="Ver Emblemas e Conquistas de Nível"
                  className="p-1.5 rounded-xl text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                >
                  <Trophy className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onLogout}
                title="Sair da Conta"
                className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Bar */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-zinc-900 scrollbar-none">
          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === 'library'
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:bg-zinc-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Biblioteca</span>
          </button>
          <button
            onClick={() => setActiveTab('yearly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === 'yearly'
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:bg-zinc-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Por Ano</span>
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:bg-zinc-900'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Notas & Dificuldade</span>
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === 'monthly'
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:bg-zinc-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Por Mês</span>
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === 'goals'
                ? 'bg-pink-600 text-white'
                : 'text-zinc-400 hover:bg-zinc-900'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Metas</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-purple-600 text-white'
                : 'text-zinc-400 hover:bg-zinc-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === 'backup'
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:bg-zinc-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Backup</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:bg-zinc-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Área do Usuário</span>
          </button>
        </div>

      </div>
    </header>
  );
};
