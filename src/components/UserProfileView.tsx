import React, { useState, useMemo } from 'react';
import { 
  User, 
  Gamepad2, 
  Trophy, 
  Clock, 
  Star, 
  Layers, 
  Link2, 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw, 
  Save, 
  Sparkles, 
  Key, 
  Settings, 
  Share2, 
  Check, 
  AlertCircle, 
  Copy, 
  Flame, 
  ShieldCheck, 
  ChevronRight,
  Info,
  Tv,
  Globe,
  Sliders,
  Award,
  Monitor,
  Download,
  Laptop,
  Terminal,
  FileCode
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Game, UserProfile, UserConnections, UserPlatformLink } from '../types.ts';
import { testPlatformConnection } from '../services/api.ts';

interface UserProfileViewProps {
  currentUser: UserProfile;
  games: Game[];
  onUpdateProfile: (updated: Partial<UserProfile>) => Promise<void> | void;
}

// Preset avatars for gamer personalization
const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=karniello',
  'https://api.dicebear.com/7.x/bottts/svg?seed=cyberpunk',
  'https://api.dicebear.com/7.x/bottts/svg?seed=shadow',
  'https://api.dicebear.com/7.x/bottts/svg?seed=valkyrie',
  'https://api.dicebear.com/7.x/bottts/svg?seed=pixelgamer',
  'https://api.dicebear.com/7.x/bottts/svg?seed=phoenix',
  'https://api.dicebear.com/7.x/bottts/svg?seed=retro',
  'https://api.dicebear.com/7.x/bottts/svg?seed=drifter',
  'https://api.dicebear.com/7.x/bottts/svg?seed=samurai',
  'https://api.dicebear.com/7.x/bottts/svg?seed=wizard',
  'https://api.dicebear.com/7.x/bottts/svg?seed=hunter',
  'https://api.dicebear.com/7.x/bottts/svg?seed=titan',
];

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  currentUser,
  games,
  onUpdateProfile,
}) => {
  // Navigation inside User Area
  const [subTab, setSubTab] = useState<'connections' | 'profile' | 'card' | 'api' | 'desktop'>('connections');
  const [copiedElectron, setCopiedElectron] = useState(false);
  const [batDownloadSuccess, setBatDownloadSuccess] = useState(false);

  // Profile Form state
  const [name, setName] = useState(currentUser.name || '');
  const [gamerTag, setGamerTag] = useState(currentUser.gamerTag || '');
  const [favoritePlatform, setFavoritePlatform] = useState(currentUser.favoritePlatform || 'PlayStation 5');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [currentlyPlaying, setCurrentlyPlaying] = useState(currentUser.currentlyPlaying || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Platform connections state
  const [connections, setConnections] = useState<UserConnections>(currentUser.connections || {});
  const [testingPlatform, setTestingPlatform] = useState<string | null>(null);
  const [connectionFeedback, setConnectionFeedback] = useState<Record<string, { type: 'success' | 'error'; message: string }>>({});
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);

  // Quick inputs for connections
  const [steamInput, setSteamInput] = useState(connections.steam?.usernameOrId || '');
  const [psnInput, setPsnInput] = useState(connections.psn?.usernameOrId || '');
  const [xboxInput, setXboxInput] = useState(connections.xbox?.usernameOrId || '');
  const [nintendoInput, setNintendoInput] = useState(connections.nintendo?.usernameOrId || '');
  const [retroInput, setRetroInput] = useState(connections.retroachievements?.usernameOrId || '');
  const [exophaseInput, setExophaseInput] = useState(connections.exophase?.usernameOrId || '');
  const [rawgKeyInput, setRawgKeyInput] = useState(connections.rawgApiKey || '');
  const [autoSyncLogin, setAutoSyncLogin] = useState(connections.autoSyncOnLogin ?? true);
  const [autoSyncGames, setAutoSyncGames] = useState(connections.autoSyncGameAchievements ?? true);

  // Aggregated Stats
  const stats = useMemo(() => {
    const totalFinished = games.length;
    const totalHours = games.reduce((acc, g) => acc + (g.hours || 0), 0);
    const avgRating = totalFinished > 0 
      ? (games.reduce((acc, g) => acc + (g.rating || 0), 0) / totalFinished).toFixed(1)
      : '0.0';

    let totalTrophies = 0;
    let unlockedTrophies = 0;
    let totalPlatinums = 0;

    games.forEach((g) => {
      if (g.achievements) {
        totalTrophies += g.achievements.length;
        g.achievements.forEach((a) => {
          if (a.unlocked) {
            unlockedTrophies++;
            if (a.type === 'platinum') totalPlatinums++;
          }
        });
      }
    });

    const connectedCount = [
      connections.steam?.connected,
      connections.psn?.connected,
      connections.xbox?.connected,
      connections.nintendo?.connected,
      connections.retroachievements?.connected,
      connections.exophase?.connected,
    ].filter(Boolean).length;

    return {
      totalFinished,
      totalHours: Math.round(totalHours),
      avgRating,
      totalTrophies,
      unlockedTrophies,
      totalPlatinums,
      connectedCount,
    };
  }, [games, connections]);

  // Save full profile
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingProfile(true);
    setProfileSaveSuccess(false);

    try {
      const updatedConnections: UserConnections = {
        ...connections,
        rawgApiKey: rawgKeyInput.trim() || undefined,
        autoSyncOnLogin: autoSyncLogin,
        autoSyncGameAchievements: autoSyncGames,
      };

      await onUpdateProfile({
        name: name.trim(),
        gamerTag: gamerTag.trim(),
        favoritePlatform,
        avatar,
        bio: bio.trim(),
        currentlyPlaying: currentlyPlaying.trim(),
        connections: updatedConnections,
      });

      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 3000);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Test and configure a platform
  const handleTestAndSavePlatform = async (platformId: 'steam' | 'psn' | 'xbox' | 'nintendo' | 'retroachievements' | 'exophase') => {
    let usernameOrId = '';
    if (platformId === 'steam') usernameOrId = steamInput;
    if (platformId === 'psn') usernameOrId = psnInput;
    if (platformId === 'xbox') usernameOrId = xboxInput;
    if (platformId === 'nintendo') usernameOrId = nintendoInput;
    if (platformId === 'retroachievements') usernameOrId = retroInput;
    if (platformId === 'exophase') usernameOrId = exophaseInput;

    if (!usernameOrId.trim()) {
      setConnectionFeedback((prev) => ({
        ...prev,
        [platformId]: { type: 'error', message: 'Por favor, informe seu usuário, ID ou link do perfil.' },
      }));
      return;
    }

    setTestingPlatform(platformId);
    setConnectionFeedback((prev) => ({ ...prev, [platformId]: undefined as any }));

    try {
      const res = await testPlatformConnection({
        platformId,
        usernameOrId: usernameOrId.trim(),
      });

      const updatedLink: UserPlatformLink = {
        platformId,
        usernameOrId: usernameOrId.trim(),
        connected: res.connected,
        lastSyncedAt: res.lastSyncedAt,
        publicProfileUrl: res.stats?.publicProfileUrl,
        stats: res.stats,
      };

      const updatedConnections: UserConnections = {
        ...connections,
        [platformId]: updatedLink,
      };

      setConnections(updatedConnections);
      await onUpdateProfile({
        connections: updatedConnections,
      });

      setConnectionFeedback((prev) => ({
        ...prev,
        [platformId]: { type: 'success', message: res.message },
      }));

      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 },
      });
    } catch (err: any) {
      setConnectionFeedback((prev) => ({
        ...prev,
        [platformId]: { type: 'error', message: err.message || 'Falha ao conectar com o serviço.' },
      }));
    } finally {
      setTestingPlatform(null);
    }
  };

  // Disconnect a platform
  const handleDisconnectPlatform = async (platformId: 'steam' | 'psn' | 'xbox' | 'nintendo' | 'retroachievements' | 'exophase') => {
    const updated = { ...connections };
    delete updated[platformId];
    setConnections(updated);

    if (platformId === 'steam') setSteamInput('');
    if (platformId === 'psn') setPsnInput('');
    if (platformId === 'xbox') setXboxInput('');
    if (platformId === 'nintendo') setNintendoInput('');
    if (platformId === 'retroachievements') setRetroInput('');
    if (platformId === 'exophase') setExophaseInput('');

    await onUpdateProfile({ connections: updated });
    setConnectionFeedback((prev) => ({
      ...prev,
      [platformId]: { type: 'success', message: 'Vinculação removida com sucesso.' },
    }));
  };

  // Sync all connected platforms
  const handleSyncAllPlatforms = async () => {
    setIsSyncingAll(true);
    const activePlatforms = (['steam', 'psn', 'xbox', 'nintendo', 'retroachievements', 'exophase'] as const)
      .filter((p) => connections[p]?.connected);

    if (activePlatforms.length === 0) {
      alert('Nenhuma plataforma vinculada ainda. Configure pelo menos uma abaixo para sincronizar.');
      setIsSyncingAll(false);
      return;
    }

    try {
      for (const p of activePlatforms) {
        await handleTestAndSavePlatform(p);
      }
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Copy shareable gamer card text
  const handleCopyGamerCard = () => {
    const text = `🎮 GameVault Gamer Card 🎮\n` +
      `Gamer: ${currentUser.name} (${currentUser.gamerTag})\n` +
      `Plataforma Favorita: ${currentUser.favoritePlatform}\n` +
      `Jogos Zerados: ${stats.totalFinished} jogos | ${stats.totalHours} horas\n` +
      `Troféus: ${stats.unlockedTrophies} conquistados (Platinas: ${stats.totalPlatinums})\n` +
      (currentUser.currentlyPlaying ? `Jogando no momento: ${currentUser.currentlyPlaying}\n` : '') +
      `Contas Vinculadas: ${stats.connectedCount} plataformas ativas`;

    navigator.clipboard.writeText(text);
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2500);
  };

  // Download Windows Batch Installer
  const handleDownloadBat = () => {
    const appUrl = window.location.origin;
    const batContent = `@echo off
chcp 65001 >nul
title Instalador GameVault Desktop
color 0B
cls
echo ========================================================
echo       GAMEVAULT - DIÁRIO DE JOGOS ZERADOS
echo       Criando instalador e atalho na sua Área de Trabalho...
echo ========================================================
echo.

set "APP_URL=${appUrl}"
set "SHORTCUT_NAME=GameVault.lnk"
set "DESKTOP_PATH=%USERPROFILE%\\Desktop\\%SHORTCUT_NAME%"

echo [1/3] Verificando navegador disponível...
set "NAV_EXE="
if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
    set "NAV_EXE=%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe"
) else if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" (
    set "NAV_EXE=%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe"
) else if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
    set "NAV_EXE=%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"
) else if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" (
    set "NAV_EXE=%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"
) else (
    set "NAV_EXE=msedge.exe"
)

echo [2/3] Gerando atalho nativo na Área de Trabalho...
set "VBS_SCRIPT=%TEMP%\\create_gamevault_shortcut.vbs"
(
echo Set oWS = WScript.CreateObject("WScript.Shell"^)
echo sLinkFile = "%DESKTOP_PATH%"
echo Set oLink = oWS.CreateShortcut(sLinkFile^)
echo oLink.TargetPath = "%NAV_EXE%"
echo oLink.Arguments = "--app=%APP_URL% --window-size=1366,850"
echo oLink.Description = "GameVault - Diário de Jogos Zerados"
echo oLink.WindowStyle = 1
echo oLink.Save
) > "%VBS_SCRIPT%"

cscript /nologo "%VBS_SCRIPT%"
del "%VBS_SCRIPT%" >nul 2>&1

echo [3/3] Atalho criado com sucesso!
echo.
echo ========================================================
echo  ✓ GameVault foi instalado na sua Área de Trabalho!
echo  Clique no ícone criado para abrir em modo Janela Nativa.
echo ========================================================
echo.
echo Deseja abrir o GameVault agora? (S/N)
set /p ABRIR=
if /i "%ABRIR%"=="S" (
    start "" "%DESKTOP_PATH%"
)
exit
`;
    const blob = new Blob([batContent], { type: 'application/x-bat;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Instalar_GameVault_Desktop.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setBatDownloadSuccess(true);
    confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
    setTimeout(() => setBatDownloadSuccess(false), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* 1. Header Banner & Profile Hero Card */}
      <div className="relative rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl">
        
        {/* Background gradient & ambient lighting */}
        <div className="h-44 sm:h-52 bg-gradient-to-r from-indigo-900 via-purple-900 to-zinc-950 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent" />
          <div className="absolute -top-12 -right-12 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Top badges */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 shadow">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gamer Hub Ativo</span>
            </span>
          </div>
        </div>

        {/* Profile info section */}
        <div className="px-6 sm:px-8 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-6">
            
            {/* Avatar & Identifiers */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <div className="relative group">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-28 sm:w-32 h-28 sm:h-32 rounded-3xl bg-zinc-950 ring-4 ring-zinc-900 shadow-2xl object-cover"
                />
                <button
                  onClick={() => setSubTab('profile')}
                  className="absolute inset-0 rounded-3xl bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-bold cursor-pointer"
                >
                  <Sliders className="w-5 h-5 mb-1" />
                  Mudar Foto
                </button>
              </div>

              <div className="pb-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {currentUser.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-mono font-bold">
                    {currentUser.gamerTag}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
                  {currentUser.bio || 'Gamer no GameVault. Registrando histórias, conquistas e momentos épicos.'}
                </p>

                {currentUser.currentlyPlaying && (
                  <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-xl bg-purple-950/60 border border-purple-500/30 text-xs text-purple-300 font-medium">
                    <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>Jogando no momento: <strong className="text-white font-bold">{currentUser.currentlyPlaying}</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleCopyGamerCard}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                {copiedCard ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedCard ? 'Cartão Copiado!' : 'Compartilhar Perfil'}</span>
              </button>

              <button
                onClick={handleSyncAllPlatforms}
                disabled={isSyncingAll}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncingAll ? 'animate-spin' : ''}`} />
                <span>{isSyncingAll ? 'Sincronizando...' : 'Sincronizar Tudo'}</span>
              </button>
            </div>
          </div>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-zinc-800/80">
            
            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1 mb-0.5">
                <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" /> Jogos Zerados
              </span>
              <span className="text-xl font-black text-white">{stats.totalFinished}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1 mb-0.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> Tempo Total
              </span>
              <span className="text-xl font-black text-white">{stats.totalHours} <span className="text-xs text-zinc-400 font-normal">horas</span></span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1 mb-0.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> Conquistas
              </span>
              <span className="text-xl font-black text-amber-400">
                {stats.unlockedTrophies} <span className="text-xs text-zinc-500 font-normal">/ {stats.totalTrophies}</span>
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1 mb-0.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Nota Média
              </span>
              <span className="text-xl font-black text-amber-400">{stats.avgRating}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex flex-col items-center justify-center text-center col-span-2 sm:col-span-1">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1 mb-0.5">
                <Link2 className="w-3.5 h-3.5 text-purple-400" /> Conexões Ativas
              </span>
              <span className="text-xl font-black text-purple-300">{stats.connectedCount} <span className="text-xs text-zinc-500 font-normal">plataformas</span></span>
            </div>

          </div>

        </div>

      </div>

      {/* 2. Navigation Tabs for User Area */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setSubTab('connections')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
            subTab === 'connections'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
              : 'text-zinc-400 hover:text-white border-transparent hover:bg-zinc-800/60'
          }`}
        >
          <Link2 className="w-4 h-4 text-amber-400" />
          <span>Vinculações de Plataformas ({stats.connectedCount})</span>
        </button>

        <button
          onClick={() => setSubTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
            subTab === 'profile'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
              : 'text-zinc-400 hover:text-white border-transparent hover:bg-zinc-800/60'
          }`}
        >
          <User className="w-4 h-4 text-indigo-400" />
          <span>Editar Perfil & Avatar</span>
        </button>

        <button
          onClick={() => setSubTab('card')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
            subTab === 'card'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
              : 'text-zinc-400 hover:text-white border-transparent hover:bg-zinc-800/60'
          }`}
        >
          <Award className="w-4 h-4 text-pink-400" />
          <span>Cartão Gamer</span>
        </button>

        <button
          onClick={() => setSubTab('api')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
            subTab === 'api'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
              : 'text-zinc-400 hover:text-white border-transparent hover:bg-zinc-800/60'
          }`}
        >
          <Key className="w-4 h-4 text-emerald-400" />
          <span>Chaves & Automação</span>
        </button>

        <button
          onClick={() => setSubTab('desktop')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
            subTab === 'desktop'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
              : 'text-zinc-400 hover:text-white border-transparent hover:bg-zinc-800/60'
          }`}
        >
          <Monitor className="w-4 h-4 text-cyan-400" />
          <span>Instalador PC (.EXE)</span>
        </button>
      </div>

      {/* 3. SUBTAB 1: Platform Connections (The central requested feature!) */}
      {subTab === 'connections' && (
        <div className="space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-400" />
                <span>Contas Conectadas & Sincronização Automática</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Configure suas contas de cada plataforma para que o GameVault possa buscar automaticamente troféus, conquistas e histórico de jogos.
              </p>
            </div>

            <button
              onClick={handleSyncAllPlatforms}
              disabled={isSyncingAll}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer self-start sm:self-auto flex-shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>Sincronizar Todas as Conexões</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* PLATFORM 1: Steam */}
            <div className={`p-5 rounded-2xl border transition-all ${
              connections.steam?.connected 
                ? 'bg-gradient-to-br from-blue-950/20 via-zinc-900 to-zinc-900 border-blue-500/40 shadow-lg' 
                : 'bg-zinc-900 border-zinc-800'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Steam Community</span>
                      {connections.steam?.connected && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </h3>
                    <p className="text-[11px] text-zinc-400">PC (Steam Deck, Windows, Mac)</p>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  connections.steam?.connected 
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {connections.steam?.connected ? 'Conectado' : 'Não vinculado'}
                </span>
              </div>

              <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                Puxa conquistas desbloqueadas, tempo de jogo e catálogo de jogos diretamente da comunidade Steam pública.
              </p>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-zinc-300">
                  ID Personalizado ou Link do Perfil:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={steamInput}
                    onChange={(e) => setSteamInput(e.target.value)}
                    placeholder="Ex: https://steamcommunity.com/id/seunick ou seunick"
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleTestAndSavePlatform('steam')}
                    disabled={testingPlatform === 'steam' || !steamInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0 flex items-center gap-1.5"
                  >
                    {testingPlatform === 'steam' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Salvar</span>
                  </button>
                  {connections.steam?.connected && (
                    <button
                      type="button"
                      onClick={() => handleDisconnectPlatform('steam')}
                      className="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-300 text-xs transition-colors cursor-pointer"
                      title="Desvincular"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {connectionFeedback.steam && (
                <div className={`mt-3 p-2.5 rounded-xl border text-xs flex items-center gap-1.5 ${
                  connectionFeedback.steam.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}>
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{connectionFeedback.steam.message}</span>
                </div>
              )}
            </div>

            {/* PLATFORM 2: PlayStation Network */}
            <div className={`p-5 rounded-2xl border transition-all ${
              connections.psn?.connected 
                ? 'bg-gradient-to-br from-indigo-950/20 via-zinc-900 to-zinc-900 border-indigo-500/40 shadow-lg' 
                : 'bg-zinc-900 border-zinc-800'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>PlayStation Network (PSN)</span>
                      {connections.psn?.connected && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </h3>
                    <p className="text-[11px] text-zinc-400">PS5, PS4, PS3 e PS Vita</p>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  connections.psn?.connected 
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {connections.psn?.connected ? 'Conectado' : 'Não vinculado'}
                </span>
              </div>

              <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                Vincule seu PSN ID e perfil no PSNProfiles para cruzar automaticamente seus troféus e platinas oficiais da Sony.
              </p>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-zinc-300">
                  PSN Online ID (Nome de Usuário PSN):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={psnInput}
                    onChange={(e) => setPsnInput(e.target.value)}
                    placeholder="Ex: SeuNomePSN ou link do PSNProfiles"
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleTestAndSavePlatform('psn')}
                    disabled={testingPlatform === 'psn' || !psnInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0 flex items-center gap-1.5"
                  >
                    {testingPlatform === 'psn' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Salvar</span>
                  </button>
                  {connections.psn?.connected && (
                    <button
                      type="button"
                      onClick={() => handleDisconnectPlatform('psn')}
                      className="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-300 text-xs transition-colors cursor-pointer"
                      title="Desvincular"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {connectionFeedback.psn && (
                <div className={`mt-3 p-2.5 rounded-xl border text-xs flex items-center gap-1.5 ${
                  connectionFeedback.psn.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}>
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{connectionFeedback.psn.message}</span>
                </div>
              )}
            </div>

            {/* PLATFORM 3: Xbox Live */}
            <div className={`p-5 rounded-2xl border transition-all ${
              connections.xbox?.connected 
                ? 'bg-gradient-to-br from-emerald-950/20 via-zinc-900 to-zinc-900 border-emerald-500/40 shadow-lg' 
                : 'bg-zinc-900 border-zinc-800'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Xbox Live / Microsoft</span>
                      {connections.xbox?.connected && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </h3>
                    <p className="text-[11px] text-zinc-400">Xbox Series X/S, One, 360 e PC Game Pass</p>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  connections.xbox?.connected 
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {connections.xbox?.connected ? 'Conectado' : 'Não vinculado'}
                </span>
              </div>

              <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                Vincule sua Gamertag do ecossistema Xbox para acompanhar pontuação Gamerscore e conquistas registradas.
              </p>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-zinc-300">
                  Xbox Gamertag:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={xboxInput}
                    onChange={(e) => setXboxInput(e.target.value)}
                    placeholder="Ex: MasterChiefBR#1234"
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleTestAndSavePlatform('xbox')}
                    disabled={testingPlatform === 'xbox' || !xboxInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0 flex items-center gap-1.5"
                  >
                    {testingPlatform === 'xbox' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Salvar</span>
                  </button>
                  {connections.xbox?.connected && (
                    <button
                      type="button"
                      onClick={() => handleDisconnectPlatform('xbox')}
                      className="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-300 text-xs transition-colors cursor-pointer"
                      title="Desvincular"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {connectionFeedback.xbox && (
                <div className={`mt-3 p-2.5 rounded-xl border text-xs flex items-center gap-1.5 ${
                  connectionFeedback.xbox.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}>
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{connectionFeedback.xbox.message}</span>
                </div>
              )}
            </div>

            {/* PLATFORM 4: RetroAchievements */}
            <div className={`p-5 rounded-2xl border transition-all ${
              connections.retroachievements?.connected 
                ? 'bg-gradient-to-br from-amber-950/20 via-zinc-900 to-zinc-900 border-amber-500/40 shadow-lg' 
                : 'bg-zinc-900 border-zinc-800'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>RetroAchievements.org</span>
                      {connections.retroachievements?.connected && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </h3>
                    <p className="text-[11px] text-zinc-400">SNES, PS1, N64, GBA, Mega Drive e Emuladores</p>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  connections.retroachievements?.connected 
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {connections.retroachievements?.connected ? 'Conectado' : 'Não vinculado'}
                </span>
              </div>

              <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                Conecte seu perfil de conquistas retrô para sincronizar jogos zerados em emuladores como RetroArch e DuckStation.
              </p>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-zinc-300">
                  Usuário do RetroAchievements:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={retroInput}
                    onChange={(e) => setRetroInput(e.target.value)}
                    placeholder="Ex: seunome_retro"
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleTestAndSavePlatform('retroachievements')}
                    disabled={testingPlatform === 'retroachievements' || !retroInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0 flex items-center gap-1.5"
                  >
                    {testingPlatform === 'retroachievements' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Salvar</span>
                  </button>
                  {connections.retroachievements?.connected && (
                    <button
                      type="button"
                      onClick={() => handleDisconnectPlatform('retroachievements')}
                      className="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-300 text-xs transition-colors cursor-pointer"
                      title="Desvincular"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {connectionFeedback.retroachievements && (
                <div className={`mt-3 p-2.5 rounded-xl border text-xs flex items-center gap-1.5 ${
                  connectionFeedback.retroachievements.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}>
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{connectionFeedback.retroachievements.message}</span>
                </div>
              )}
            </div>

            {/* PLATFORM 5: Exophase (Unified Hub) */}
            <div className={`p-5 rounded-2xl border transition-all ${
              connections.exophase?.connected 
                ? 'bg-gradient-to-br from-purple-950/20 via-zinc-900 to-zinc-900 border-purple-500/40 shadow-lg' 
                : 'bg-zinc-900 border-zinc-800'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Exophase (Hub Unificado)</span>
                      {connections.exophase?.connected && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </h3>
                    <p className="text-[11px] text-zinc-400">Multiplataforma (PSN, Xbox, Steam, GOG, Retro)</p>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  connections.exophase?.connected 
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {connections.exophase?.connected ? 'Conectado' : 'Não vinculado'}
                </span>
              </div>

              <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                O Exophase agrega todas as suas conquistas de consoles e PC em uma única página pública.
              </p>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-zinc-300">
                  URL ou Nome de Usuário Exophase:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={exophaseInput}
                    onChange={(e) => setExophaseInput(e.target.value)}
                    placeholder="Ex: https://www.exophase.com/user/seunome/ ou seunome"
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleTestAndSavePlatform('exophase')}
                    disabled={testingPlatform === 'exophase' || !exophaseInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0 flex items-center gap-1.5"
                  >
                    {testingPlatform === 'exophase' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Salvar</span>
                  </button>
                  {connections.exophase?.connected && (
                    <button
                      type="button"
                      onClick={() => handleDisconnectPlatform('exophase')}
                      className="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-300 text-xs transition-colors cursor-pointer"
                      title="Desvincular"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {connectionFeedback.exophase && (
                <div className={`mt-3 p-2.5 rounded-xl border text-xs flex items-center gap-1.5 ${
                  connectionFeedback.exophase.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}>
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{connectionFeedback.exophase.message}</span>
                </div>
              )}
            </div>

            {/* PLATFORM 6: Nintendo Switch */}
            <div className={`p-5 rounded-2xl border transition-all ${
              connections.nintendo?.connected 
                ? 'bg-gradient-to-br from-rose-950/20 via-zinc-900 to-zinc-900 border-rose-500/40 shadow-lg' 
                : 'bg-zinc-900 border-zinc-800'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Nintendo Switch</span>
                      {connections.nintendo?.connected && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </h3>
                    <p className="text-[11px] text-zinc-400">Nintendo Switch & 3DS</p>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  connections.nintendo?.connected 
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {connections.nintendo?.connected ? 'Conectado' : 'Não vinculado'}
                </span>
              </div>

              <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                Vincule seu Friend Code para exibir sua identificação de jogador oficial da Nintendo no GameVault.
              </p>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-zinc-300">
                  Nintendo Friend Code (SW-XXXX-XXXX-XXXX):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nintendoInput}
                    onChange={(e) => setNintendoInput(e.target.value)}
                    placeholder="Ex: SW-1234-5678-9012"
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleTestAndSavePlatform('nintendo')}
                    disabled={testingPlatform === 'nintendo' || !nintendoInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0 flex items-center gap-1.5"
                  >
                    {testingPlatform === 'nintendo' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Salvar</span>
                  </button>
                  {connections.nintendo?.connected && (
                    <button
                      type="button"
                      onClick={() => handleDisconnectPlatform('nintendo')}
                      className="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-300 text-xs transition-colors cursor-pointer"
                      title="Desvincular"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {connectionFeedback.nintendo && (
                <div className={`mt-3 p-2.5 rounded-xl border text-xs flex items-center gap-1.5 ${
                  connectionFeedback.nintendo.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}>
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{connectionFeedback.nintendo.message}</span>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* 4. SUBTAB 2: Edit Profile & Gamer Identity */}
      {subTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6 max-w-3xl">
          
          <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" />
              <span>Personalização de Perfil Gamer</span>
            </h2>

            {/* Avatar Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Escolha seu Avatar ou insira uma URL:
              </label>

              <div className="flex items-center gap-4">
                <img
                  src={avatar || currentUser.avatar}
                  alt="Avatar Atual"
                  className="w-16 h-16 rounded-2xl bg-zinc-950 ring-2 ring-indigo-500 object-cover flex-shrink-0"
                />
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="URL direta da imagem (https://...)"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-2">
                {AVATAR_PRESETS.map((pUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(pUrl)}
                    className={`w-10 h-10 rounded-xl overflow-hidden bg-zinc-950 border-2 transition-all cursor-pointer ${
                      avatar === pUrl ? 'border-indigo-500 scale-105 shadow-md shadow-indigo-500/30' : 'border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <img src={pUrl} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Name & Gamertag */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Nome de Exibição:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">GamerTag:</label>
                <input
                  type="text"
                  required
                  value={gamerTag}
                  onChange={(e) => setGamerTag(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Favorite Platform & Currently Playing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Plataforma / Console Principal:</label>
                <select
                  value={favoritePlatform}
                  onChange={(e) => setFavoritePlatform(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="PlayStation 5">PlayStation 5</option>
                  <option value="PC (Steam / Epic)">PC (Steam / Epic)</option>
                  <option value="Nintendo Switch">Nintendo Switch</option>
                  <option value="Xbox Series X/S">Xbox Series X/S</option>
                  <option value="PlayStation 4">PlayStation 4</option>
                  <option value="Xbox One">Xbox One</option>
                  <option value="Emulador / Retrogaming">Emulador / Retrogaming</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Jogando Atualmente (Status):</label>
                <input
                  type="text"
                  value={currentlyPlaying}
                  onChange={(e) => setCurrentlyPlaying(e.target.value)}
                  placeholder="Ex: Elden Ring: Shadow of the Erdtree"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Bio / Motto */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Bio Gamer / Lema:</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Conte sobre seus gêneros favoritos, consoles clássicos ou desafios que gosta de completar..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-2">
              <div>
                {profileSaveSuccess && (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" /> Perfil atualizado com sucesso!
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSavingProfile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Salvar Perfil Gamer</span>
              </button>
            </div>

          </div>

        </form>
      )}

      {/* 5. SUBTAB 3: Gamer Card Share Preview */}
      {subTab === 'card' && (
        <div className="space-y-6 max-w-2xl">
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
            <h3 className="text-sm font-bold text-white mb-1">Seu Cartão Oficial GameVault</h3>
            <p className="text-xs text-zinc-400">
              Este cartão resume sua identidade gamer e progresso geral. Você pode copiar o resumo ou compartilhá-lo com amigos.
            </p>
          </div>

          {/* Card Visual Mockup */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-zinc-900 via-indigo-950/40 to-purple-950/50 border border-indigo-500/30 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-16 h-16 rounded-2xl bg-zinc-950 ring-2 ring-indigo-500/50 object-cover shadow-lg"
                />
                <div>
                  <h4 className="text-xl font-black text-white">{currentUser.name}</h4>
                  <p className="text-xs font-mono text-indigo-300 font-bold">{currentUser.gamerTag}</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{currentUser.favoritePlatform}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">GAMEVAULT ID</span>
                <p className="text-xs font-mono font-bold text-purple-300">VERIFIED GAMER</p>
              </div>
            </div>

            {currentUser.bio && (
              <p className="text-xs text-zinc-300 italic bg-black/40 p-3 rounded-xl border border-white/5">
                "{currentUser.bio}"
              </p>
            )}

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-black/50 border border-zinc-800 text-center">
                <span className="text-[10px] text-zinc-400 block">Zerados</span>
                <span className="text-lg font-black text-white">{stats.totalFinished}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-zinc-800 text-center">
                <span className="text-[10px] text-zinc-400 block">Horas Totais</span>
                <span className="text-lg font-black text-white">{stats.totalHours}h</span>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-zinc-800 text-center">
                <span className="text-[10px] text-zinc-400 block">Troféus Concluídos</span>
                <span className="text-lg font-black text-amber-400">{stats.unlockedTrophies}</span>
              </div>
            </div>

            {/* Connected Platform Badges */}
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-zinc-800">
              <span className="text-[11px] text-zinc-400">Plataformas Conectadas:</span>
              {connections.steam?.connected && (
                <span className="px-2 py-0.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[10px] font-bold">
                  Steam ({connections.steam.usernameOrId})
                </span>
              )}
              {connections.psn?.connected && (
                <span className="px-2 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold">
                  PSN ({connections.psn.usernameOrId})
                </span>
              )}
              {connections.xbox?.connected && (
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                  Xbox ({connections.xbox.usernameOrId})
                </span>
              )}
              {connections.retroachievements?.connected && (
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                  RetroAchievements ({connections.retroachievements.usernameOrId})
                </span>
              )}
              {stats.connectedCount === 0 && (
                <span className="text-[11px] text-zinc-500 italic">Nenhuma plataforma vinculada ainda</span>
              )}
            </div>
          </div>

          <button
            onClick={handleCopyGamerCard}
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
          >
            {copiedCard ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCard ? 'Resumo Copiado para a Área de Transferência!' : 'Copiar Resumo do Cartão Gamer'}</span>
          </button>
        </div>
      )}

      {/* 6. SUBTAB 4: Custom API Keys & Automation */}
      {subTab === 'api' && (
        <div className="space-y-6 max-w-2xl">
          
          <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-400" />
              <span>Chaves de API Pessoais (Opcional)</span>
            </h2>

            <p className="text-xs text-zinc-400 leading-relaxed">
              O GameVault já inclui buscas automáticas no servidor. Caso prefira utilizar suas próprias chaves de desenvolvedor da RAWG ou IGDB para requisições dedicadas, cadastre-as abaixo:
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">RAWG Video Games Database API Key:</label>
                <a
                  href="https://rawg.io/apidocs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                >
                  Obter chave gratuita no RAWG <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                value={rawgKeyInput}
                onChange={(e) => setRawgKeyInput(e.target.value)}
                placeholder="Insira sua chave de API RAWG..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Automation Preferences */}
            <div className="pt-4 border-t border-zinc-800 space-y-3">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Preferências de Automação
              </h3>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSyncLogin}
                  onChange={(e) => setAutoSyncLogin(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-zinc-900 border-zinc-700"
                />
                <div>
                  <span className="text-xs font-semibold text-zinc-200 block">Sincronizar contas automaticamente ao entrar</span>
                  <span className="text-[11px] text-zinc-500">Executa uma verificação rápida de contas conectadas ao abrir a sessão.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSyncGames}
                  onChange={(e) => setAutoSyncGames(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-zinc-900 border-zinc-700"
                />
                <div>
                  <span className="text-xs font-semibold text-zinc-200 block">Carregar lista de troféus ao cadastrar novos jogos</span>
                  <span className="text-[11px] text-zinc-500">Busca automaticamente as conquistas oficiais quando você registra um novo jogo.</span>
                </div>
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveProfile()}
                disabled={isSavingProfile}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Configurações</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* 5. SUBTAB 5: Desktop Installer (.EXE & PWA) */}
      {subTab === 'desktop' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/30 via-zinc-900 to-indigo-950/30 border border-cyan-500/30 relative overflow-hidden">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0">
                <Monitor className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>GameVault Desktop para Windows</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                    PC / Windows 10 & 11
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Tenha o GameVault instalado diretamente no seu computador com ícone na Área de Trabalho e execução em janela limpa independente.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Option A: One-click Batch Installer (.bat) */}
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3.5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <FileCode className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">
                  Instalador com Atalho Windows (.bat)
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Baixe um instalador leve pré-configurado. Ao executá-lo no Windows, ele cria um atalho nativo na sua Área de Trabalho que abre o GameVault em modo aplicativo sem barras de navegador.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadBat}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Instalador_GameVault_Desktop.bat</span>
                </button>

                {batDownloadSuccess && (
                  <p className="text-[11px] text-emerald-400 text-center font-semibold">
                    ✓ Baixado! Dê 2 cliques no arquivo na pasta Downloads.
                  </p>
                )}
              </div>
            </div>

            {/* Option B: Direct Browser Native App (PWA) */}
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3.5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Laptop className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">
                  Instalação Direta no Navegador (Chrome / Edge)
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  No Microsoft Edge ou Chrome, você pode instalar instantaneamente clicando no ícone <strong>⊕</strong> na barra de endereços (topo direito) ou no menu <em>Aplicativos &gt; Instalar GameVault</em>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-400 space-y-1">
                <p className="font-semibold text-zinc-300">Como instalar agora:</p>
                <p>1. Procure o ícone de instalação (computador com seta) na barra de URL.</p>
                <p>2. Clique em "Instalar". Um ícone será fixado no Menu Iniciar.</p>
              </div>
            </div>

          </div>

          {/* Option C: Compile Standalone .EXE with Electron */}
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Compilar Executável Offline .EXE com Electron
                </h4>
                <p className="text-xs text-zinc-400">
                  Para gerar o instalador compilado <code>GameVault-Setup-1.0.0.exe</code> localmente via Electron Builder:
                </p>
              </div>
            </div>

            <div className="relative p-3.5 rounded-xl bg-black border border-zinc-800 font-mono text-xs text-emerald-400 overflow-x-auto">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText('npm install -D electron electron-builder\nnpm run build\nnpx electron-builder --win nsis');
                  setCopiedElectron(true);
                  setTimeout(() => setCopiedElectron(false), 2500);
                }}
                className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="Copiar comandos"
              >
                {copiedElectron ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <pre className="pr-10 whitespace-pre">
{`# Instalar ferramentas de build
npm install -D electron electron-builder

# Gerar instalador .exe do Windows
npm run build
npx electron-builder --win nsis`}
              </pre>
            </div>
            <p className="text-[11px] text-zinc-500">
              O arquivo <code>GameVault-Setup-1.0.0.exe</code> será gerado na pasta <code>dist_electron/</code> pronto para distribuição.
            </p>
          </div>

        </div>
      )}

    </div>
  );
};
