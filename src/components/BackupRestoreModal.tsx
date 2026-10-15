import React, { useState, useRef } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  FileJson,
  Layers,
  ArrowRight,
  Copy,
  Code2,
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { Game, UserProfile } from '../types';
import { 
  createBackupJSON, 
  downloadFile, 
  exportGamesToCSV, 
  parseAndValidateBackup 
} from '../services/storage';
import { INITIAL_GAMES } from '../constants/initialData';

interface BackupRestoreModalProps {
  games: Game[];
  currentUser: UserProfile;
  onRestoreGames: (games: Game[]) => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  games,
  currentUser,
  onRestoreGames,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [previewData, setPreviewData] = useState<{
    count: number;
    games: Game[];
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // 1. Export JSON Backup
  const handleExportJSON = () => {
    try {
      const jsonStr = createBackupJSON(games, currentUser);
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `gamevault_backup_${currentUser.username}_${dateStr}.json`;
      downloadFile(jsonStr, filename, 'application/json');
      setStatusMessage({
        type: 'success',
        text: `Backup completo exportado com sucesso! Arquivo: ${filename}`,
      });
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Erro ao gerar arquivo de backup.',
      });
    }
  };

  // 2. Export CSV Spreadsheet
  const handleExportCSV = () => {
    try {
      const csvStr = exportGamesToCSV(games);
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `gamevault_jogos_${dateStr}.csv`;
      downloadFile('\uFEFF' + csvStr, filename, 'text/csv;charset=utf-8;');
      setStatusMessage({
        type: 'success',
        text: `Planilha CSV exportada com sucesso! Arquivo: ${filename}`,
      });
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Erro ao exportar planilha CSV.',
      });
    }
  };

  // 3. Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = parseAndValidateBackup(content);
      if (res.success) {
        setPreviewData({
          count: res.importedCount,
          games: res.games,
        });
        setStatusMessage({
          type: 'success',
          text: `Arquivo validado: ${res.importedCount} jogos identificados e prontos para restauração.`,
        });
      } else {
        setPreviewData(null);
        setStatusMessage({
          type: 'error',
          text: res.error || 'Arquivo JSON inválido.',
        });
      }
    };
    reader.readAsText(file);
    // reset input value so re-uploading same file triggers event
    e.target.value = '';
  };

  // 4. Apply Restore
  const handleConfirmRestore = () => {
    if (!previewData || previewData.games.length === 0) return;

    if (restoreMode === 'replace') {
      onRestoreGames(previewData.games);
      setStatusMessage({
        type: 'success',
        text: `Base restaurada com sucesso! ${previewData.games.length} jogos carregados.`,
      });
    } else {
      // Merge mode: keep existing, add new games if title doesn't exist
      const existingTitles = new Set(games.map((g) => g.title.toLowerCase().trim()));
      const newGamesToAdd = previewData.games.filter(
        (g) => !existingTitles.has(g.title.toLowerCase().trim())
      );
      const merged = [...games, ...newGamesToAdd];
      onRestoreGames(merged);
      setStatusMessage({
        type: 'success',
        text: `Mesclagem concluída! ${newGamesToAdd.length} novos jogos adicionados (Total: ${merged.length}).`,
      });
    }

    setPreviewData(null);
  };

  // 5. Reset to sample demo games
  const handleResetToDemo = () => {
    if (window.confirm('Deseja recarregar a coleção modelo com 10 jogos zerados de demonstração? Isso substituirá sua lista atual.')) {
      onRestoreGames(INITIAL_GAMES);
      setStatusMessage({
        type: 'success',
        text: 'Coleção padrão de demonstração restaurada com sucesso!',
      });
      setPreviewData(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <Database className="w-6 h-6 text-indigo-400" />
          <span>Backup & Restauração da Base de Dados</span>
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Salve cópias seguras de todos os seus jogos cadastrados ou restaure backups anteriores a qualquer momento
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center gap-3 animate-in fade-in duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Two main columns: Export and Restore */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Fazer Backup (Export) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
              <Download className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">
              Exportar Backup dos Dados
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Gere um arquivo portátil com todos os <strong>{games.length} jogos cadastrados</strong>, incluindo notas, horas, plataformas, thumbnails, anotações pessoais e datas.
            </p>

            <div className="mt-4 p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 space-y-1">
              <div className="flex justify-between">
                <span>Total de jogos no backup:</span>
                <strong className="text-white">{games.length}</strong>
              </div>
              <div className="flex justify-between">
                <span>Usuário atual:</span>
                <strong className="text-white">{currentUser.name} ({currentUser.gamerTag})</strong>
              </div>
              <div className="flex justify-between">
                <span>Formato de saída:</span>
                <strong className="text-indigo-400">JSON Estruturado</strong>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={handleExportJSON}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileJson className="w-4 h-4" />
              <span>Baixar Arquivo de Backup (JSON)</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="w-full py-2.5 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-semibold text-xs border border-zinc-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Exportar Planilha (CSV / Excel)</span>
            </button>
          </div>
        </div>

        {/* Card 2: Restaurar Backup (Import) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
              <Upload className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">
              Restaurar Base de Dados
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Carregue um arquivo <code className="text-purple-400 font-mono">.json</code> exportado previamente para restaurar sua coleção.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Drop / Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 border-2 border-dashed border-zinc-700 hover:border-purple-500 rounded-2xl p-6 text-center bg-zinc-950/60 hover:bg-zinc-950 transition-all cursor-pointer group"
            >
              <Upload className="w-8 h-8 text-zinc-500 group-hover:text-purple-400 mx-auto mb-2 transition-colors" />
              <p className="text-xs sm:text-sm font-semibold text-zinc-300 group-hover:text-white">
                Clique para selecionar o arquivo de backup (.json)
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Compatível com GameVault e exportações JSON de jogos
              </p>
            </div>

            {/* Preview of Parsed Data */}
            {previewData && (
              <div className="mt-4 p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300">
                    Jogos Encontrados no Arquivo:
                  </span>
                  <span className="text-sm font-extrabold text-white px-2 py-0.5 rounded bg-purple-500/30">
                    {previewData.count} jogos
                  </span>
                </div>

                {/* Restoration Mode Selector */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[11px] font-semibold text-zinc-400 block">
                    Modo de Restauração:
                  </label>
                  
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="restoreMode"
                      value="replace"
                      checked={restoreMode === 'replace'}
                      onChange={() => setRestoreMode('replace')}
                      className="accent-purple-500 cursor-pointer"
                    />
                    <span><strong>Substituir:</strong> apaga a lista atual e carrega este arquivo</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="restoreMode"
                      value="merge"
                      checked={restoreMode === 'merge'}
                      onChange={() => setRestoreMode('merge')}
                      className="accent-purple-500 cursor-pointer"
                    />
                    <span><strong>Mesclar:</strong> junta aos jogos atuais sem duplicar títulos</span>
                  </label>
                </div>

                <button
                  onClick={handleConfirmRestore}
                  className="w-full mt-3 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar e Restaurar Agora</span>
                </button>
              </div>
            )}
          </div>

            {/* Reset button */}
          <div className="pt-2">
            <button
              onClick={handleResetToDemo}
              className="w-full py-2.5 px-4 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium border border-zinc-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Recarregar Coleção Padrão de Demonstração (10 jogos)</span>
            </button>
          </div>
        </div>

      </div>

      {/* Card 3: Supabase Integration & Migrations Card */}
      <div className="bg-zinc-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M11.996 0C5.37 0 0 5.37 0 11.996c0 6.626 5.37 12.004 11.996 12.004 6.626 0 12.004-5.378 12.004-12.004C24 5.37 18.622 0 11.996 0zm-1.07 19.535l-5.63-7.534h4.707l.923-5.228 5.63 7.533h-4.707l-.923 5.229z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Integração Supabase & Migrações</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Pronto
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Arquivo gerado em <code className="text-emerald-400 font-mono">supabase/migrations/20261015000000_create_gamevault_schema.sql</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const sqlContent = `-- Supabase Migration: 20261015000000_create_gamevault_schema.sql
-- Application: GameVault (Diário de Jogos Zerados)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT,
  name TEXT,
  avatar_url TEXT,
  gamer_tag TEXT,
  favorite_platform TEXT DEFAULT 'PlayStation 5',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.games (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  thumbnail TEXT NOT NULL,
  platform TEXT NOT NULL,
  genre TEXT NOT NULL,
  completion_condition TEXT NOT NULL,
  rating REAL NOT NULL DEFAULT 8.0,
  difficulty TEXT NOT NULL DEFAULT 'Normal',
  hours REAL NOT NULL DEFAULT 0,
  completed_date TEXT NOT NULL,
  release_year INTEGER,
  developer TEXT,
  publisher TEXT,
  synopsis TEXT,
  notes TEXT,
  favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.yearly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  target_games INTEGER NOT NULL DEFAULT 12,
  target_hours REAL DEFAULT 200,
  notes TEXT,
  backlog JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT yearly_goals_user_year_unique UNIQUE (user_id, year)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yearly_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own games" ON public.games FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own games" ON public.games FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own games" ON public.games FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own games" ON public.games FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own yearly goals" ON public.yearly_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own yearly goals" ON public.yearly_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own yearly goals" ON public.yearly_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own yearly goals" ON public.yearly_goals FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, username, avatar_url, gamer_tag)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'user_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || new.id::text),
    UPPER(COALESCE(new.raw_user_meta_data->>'user_name', split_part(new.email, '@', 1))) || '#' || floor(random() * 9000 + 1000)::text
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;
                navigator.clipboard.writeText(sqlContent);
                setStatusMessage({
                  type: 'success',
                  text: 'Script SQL de Migração do Supabase copiado para a área de transferência!',
                });
              }}
              className="py-2 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold border border-zinc-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copiar SQL</span>
            </button>

            <button
              onClick={() => {
                const sqlContent = `-- Supabase Migration: 20261015000000_create_gamevault_schema.sql
-- Application: GameVault (Diário de Jogos Zerados)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT,
  name TEXT,
  avatar_url TEXT,
  gamer_tag TEXT,
  favorite_platform TEXT DEFAULT 'PlayStation 5',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.games (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  thumbnail TEXT NOT NULL,
  platform TEXT NOT NULL,
  genre TEXT NOT NULL,
  completion_condition TEXT NOT NULL,
  rating REAL NOT NULL DEFAULT 8.0,
  difficulty TEXT NOT NULL DEFAULT 'Normal',
  hours REAL NOT NULL DEFAULT 0,
  completed_date TEXT NOT NULL,
  release_year INTEGER,
  developer TEXT,
  publisher TEXT,
  synopsis TEXT,
  notes TEXT,
  favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.yearly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  target_games INTEGER NOT NULL DEFAULT 12,
  target_hours REAL DEFAULT 200,
  notes TEXT,
  backlog JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT yearly_goals_user_year_unique UNIQUE (user_id, year)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yearly_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own games" ON public.games FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own games" ON public.games FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own games" ON public.games FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own games" ON public.games FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own yearly goals" ON public.yearly_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own yearly goals" ON public.yearly_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own yearly goals" ON public.yearly_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own yearly goals" ON public.yearly_goals FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, username, avatar_url, gamer_tag)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'user_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || new.id::text),
    UPPER(COALESCE(new.raw_user_meta_data->>'user_name', split_part(new.email, '@', 1))) || '#' || floor(random() * 9000 + 1000)::text
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;
                downloadFile(sqlContent, '20261015000000_create_gamevault_schema.sql', 'application/sql');
                setStatusMessage({
                  type: 'success',
                  text: 'Download do arquivo de migração iniciado (20261015000000_create_gamevault_schema.sql).',
                });
              }}
              className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar .sql</span>
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-zinc-300">
          <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800">
            <div className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Row Level Security (RLS)</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Políticas de segurança ativas para isolar dados de cada usuário com <code className="text-zinc-300">auth.uid()</code>.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800">
            <div className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5" />
              <span>Tabelas & Triggers</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Tabelas <code className="text-zinc-300">profiles</code>, <code className="text-zinc-300">games</code> e <code className="text-zinc-300">yearly_goals</code> com triggers automáticos de criação.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800">
            <div className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>Variáveis de Ambiente</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Configuráveis via <code className="text-zinc-300">VITE_SUPABASE_URL</code> e <code className="text-zinc-300">VITE_SUPABASE_ANON_KEY</code>.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
