import React, { useState } from 'react';
import { Gamepad2, Lock, User, Sparkles, ArrowRight, ShieldCheck, PlayCircle, Eye, EyeOff, Cloud, CheckCircle } from 'lucide-react';
import { loginUser, registerUser, getRegisteredUsers } from '../services/storage';
import { UserProfile } from '../types';
import { auth, googleAuthProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { setAuthToken, fetchCloudUser, syncCloudGames } from '../services/api';
import { INITIAL_GAMES } from '../constants/initialData';

interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile, isCloud?: boolean) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const token = await result.user.getIdToken();
      setAuthToken(token);

      // Sync or fetch profile from PostgreSQL database
      const cloudProfile = await fetchCloudUser(token);
      if (cloudProfile) {
        onLoginSuccess(cloudProfile, true);
      } else {
        const fallbackProfile: UserProfile = {
          id: result.user.uid,
          username: result.user.displayName?.toLowerCase().replace(/\s+/g, '_') || 'gamer',
          name: result.user.displayName || 'Gamer',
          email: result.user.email || 'gamer@cloud.local',
          avatar: result.user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${result.user.uid}`,
          gamerTag: `${(result.user.displayName || 'GAMER').toUpperCase().replace(/\s+/g, '')}#${Math.floor(1000 + Math.random() * 9000)}`,
          favoritePlatform: 'PlayStation 5',
        };
        onLoginSuccess(fallbackProfile, true);
      }
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setError(err?.message || 'Erro ao conectar com Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Por favor preencha o nome de usuário e a senha.');
      return;
    }

    if (password.length < 3) {
      setError('A senha deve ter pelo menos 3 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      if (isRegistering) {
        const newUser = registerUser(username, password, name || username);
        onLoginSuccess(newUser, false);
      } else {
        const users = getRegisteredUsers();
        if (users.length === 0) {
          const defaultUser = registerUser(username, password, name || username);
          onLoginSuccess(defaultUser, false);
        } else {
          const user = loginUser(username, password);
          onLoginSuccess(user, false);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Erro durante a autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestDemo = () => {
    setError(null);
    try {
      const users = getRegisteredUsers();
      const existingDemo = users.find((u) => u.username.toLowerCase() === 'gamer');
      if (existingDemo) {
        const user = loginUser('gamer', '1234');
        onLoginSuccess(user, false);
      } else {
        const newUser = registerUser('Gamer', '1234', 'Mestre Gamer', 'gamer@gamevault.app');
        onLoginSuccess(newUser, false);
      }
    } catch {
      const guestProfile: UserProfile = {
        id: 'guest_user',
        username: 'Gamer',
        name: 'Mestre Gamer',
        email: 'gamer@gamevault.app',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Gamer',
        gamerTag: 'GAMER#2026',
        favoritePlatform: 'PlayStation 5',
      };
      onLoginSuccess(guestProfile, false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* App Hero Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-2xl shadow-purple-600/30 ring-1 ring-white/30 mb-4 transform hover:scale-105 transition-transform">
            <Gamepad2 className="w-11 h-11 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
            Game<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Vault</span>
          </h1>
          <p className="text-sm text-zinc-400 max-w-xs mx-auto">
            Seu diário definitivo de jogos zerados com sincronização em nuvem PostgreSQL.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          
          {/* Cloud Database Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full py-3.5 px-4 mb-5 rounded-2xl bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700 text-white font-semibold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer group"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isGoogleLoading ? 'Conectando à Nuvem...' : 'Entrar com Google (Nuvem SQL)'}</span>
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="h-px bg-zinc-800 flex-1" />
            <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">ou login local</span>
            <div className="h-px bg-zinc-800 flex-1" />
          </div>

          {/* Tabs: Entrar vs Cadastrar */}
          <div className="flex bg-zinc-950/80 p-1 rounded-2xl border border-zinc-800/80 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(false);
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                !isRegistering
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Entrar na Conta
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegistering(true);
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                isRegistering
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Criar Nova Conta
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Seu Nome ou Apelido
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Carlos Gamer"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Nome de Usuário / Login
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: gamer"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Senha
                </label>
                {!isRegistering && (
                  <span className="text-[11px] text-zinc-500">
                    Padrão demo: 1234
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{isRegistering ? 'Criar Conta e Acessar' : 'Entrar no GameVault'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access Divider */}
          <div className="mt-6 pt-5 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={handleGuestDemo}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white font-medium text-xs flex items-center justify-center gap-2.5 border border-zinc-700/60 transition-all group cursor-pointer"
            >
              <PlayCircle className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <span>Acesso Rápido / Modo Demonstração (com 10 jogos)</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-zinc-600 mt-6 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          <span>GameVault • PostgreSQL Relacional + Drizzle Migrations Ativos</span>
        </p>
      </div>
    </div>
  );
};
