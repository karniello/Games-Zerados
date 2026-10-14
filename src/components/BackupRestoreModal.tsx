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
  ArrowRight
} from 'lucide-react';
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

    </div>
  );
};
