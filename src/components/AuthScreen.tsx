import React, { useState } from 'react';
import { Gamepad2, Lock, User, Sparkles, ArrowRight, ShieldCheck, PlayCircle, Eye, EyeOff } from 'lucide-react';
import { loginUser, registerUser, getRegisteredUsers } from '../services/storage';
import { UserProfile } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
        onLoginSuccess(newUser);
      } else {
        const users = getRegisteredUsers();
        // If no users exist yet and someone tries to login with 'admin' or anything, auto-register demo user or login
        if (users.length === 0) {
          const defaultUser = registerUser(username, password, name || username);
          onLoginSuccess(defaultUser);
        } else {
          const user = loginUser(username, password);
          onLoginSuccess(user);
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
        onLoginSuccess(user);
      } else {
        const newUser = registerUser('Gamer', '1234', 'Mestre Gamer', 'gamer@gamevault.app');
        onLoginSuccess(newUser);
      }
    } catch {
      // If error, force login or create
      const guestProfile: UserProfile = {
        id: 'guest_user',
        username: 'Gamer',
        name: 'Mestre Gamer',
        email: 'gamer@gamevault.app',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Gamer',
        gamerTag: 'GAMER#2026',
        favoritePlatform: 'PlayStation 5',
      };
      onLoginSuccess(guestProfile);
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
            Seu diário definitivo de jogos zerados. Estatísticas, histórico e sincronização inteligente.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          
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
          <span>GameVault • Salvo localmente com suporte a backup JSON</span>
        </p>
      </div>
    </div>
  );
};
