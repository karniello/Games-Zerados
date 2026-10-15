import React, { useState } from 'react';
import { 
  X, 
  Monitor, 
  Download, 
  CheckCircle2, 
  Terminal, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Laptop,
  ArrowRight,
  Tv,
  Layers,
  HelpCircle,
  FileCode
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

interface DesktopInstallerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopInstallerModal: React.FC<DesktopInstallerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, isInstalled, install, isWindows } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'quick' | 'bat' | 'electron'>('quick');
  const [copiedScript, setCopiedScript] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const appUrl = window.location.origin;

  // Generate and download a Windows batch installer script that creates a native desktop shortcut
  const handleDownloadWindowsInstaller = () => {
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

    setDownloadSuccess(true);
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
    });
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } else {
      setActiveTab('bat');
    }
  };

  const electronBuildCommands = `# 1. Instalar as dependências do Electron
npm install -D electron electron-builder

# 2. Gerar o executável instalador para Windows (.exe)
npm run build
npx electron-builder --win nsis`;

  const handleCopyCommands = () => {
    navigator.clipboard.writeText(electronBuildCommands);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        
        {/* Header with visual banner */}
        <div className="relative p-6 bg-gradient-to-r from-indigo-950 via-purple-950 to-zinc-950 border-b border-zinc-800 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/80 transition-colors cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-purple-500/25 ring-2 ring-white/20">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Instalador Desktop (Windows / PC)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                  App Nativo
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">
                Execute o GameVault direto da sua Área de Trabalho, sem barras do navegador
              </p>
            </div>
          </div>

          {/* Subtabs selector */}
          <div className="flex items-center gap-1.5 mt-5 p-1 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('quick')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer text-center ${
                activeTab === 'quick'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              1. Instalação Direta (PWA)
            </button>
            <button
              onClick={() => setActiveTab('bat')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer text-center ${
                activeTab === 'bat'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              2. Instalador Windows (.bat)
            </button>
            <button
              onClick={() => setActiveTab('electron')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer text-center ${
                activeTab === 'electron'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              3. Compilar .EXE (Electron)
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[68vh]">

          {/* TAB 1: Direct 1-Click PWA App Installation */}
          {activeTab === 'quick' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex-shrink-0">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Aplicativo de Janela Nativa no Windows</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                        Recomendado
                      </span>
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      O GameVault é configurado como Progressive Web App (PWA). Ele instala na pasta de programas do Windows com ícone no Menu Iniciar, Área de Trabalho e Barra de Tarefas, abrindo em janela limpa independente.
                    </p>
                  </div>
                </div>

                {isInstalled ? (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>O GameVault já está instalado como aplicativo nativo no seu computador!</span>
                  </div>
                ) : isInstallable ? (
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Instalar GameVault no Windows Agora</span>
                  </button>
                ) : (
                  <div className="space-y-2 pt-1">
                    <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
                      <strong>Dica para instalar no Chrome ou Microsoft Edge:</strong>
                      <ol className="list-decimal list-inside mt-1.5 space-y-1 text-zinc-300">
                        <li>Olhe para a <strong>barra de endereço (URL)</strong> no topo do navegador.</li>
                        <li>Clique no ícone de <strong>instalar (⊕ ou computador com seta)</strong> à direita da URL.</li>
                        <li>Clique em <strong>Instalar</strong>. O GameVault abrirá instantaneamente como um app executável do Windows!</li>
                      </ol>
                    </div>

                    <button
                      onClick={() => setActiveTab('bat')}
                      className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Ou prefere baixar o instalador de atalho (.bat)?</span>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                    </button>
                  </div>
                )}
              </div>

              {/* Advantages List */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-zinc-200">100% Seguro</p>
                  <p className="text-[11px] text-zinc-400">Sem antivírus acusando falso positivo</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-center">
                  <Sparkles className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-zinc-200">Atualizações Auto</p>
                  <p className="text-[11px] text-zinc-400">Recebe melhorias e novos jogos sempre</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-center">
                  <Monitor className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-zinc-200">Janela Nativa</p>
                  <p className="text-[11px] text-zinc-400">Sem abas, favoritos ou barra de URL</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Downloadable Windows Batch Installer (.bat) */}
          {activeTab === 'bat' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex-shrink-0">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Instalador de Atalho para Windows (.bat)
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Criamos um script executável que você baixa com 1 clique. Ao dar 2 cliques nele no seu Windows, ele cria automaticamente o atalho <strong>GameVault</strong> na sua Área de Trabalho configurado no modo de janela nativa (<code>--app</code>).
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDownloadWindowsInstaller}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Instalador_GameVault_Desktop.bat</span>
                </button>

                {downloadSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Arquivo baixado com sucesso! Vá na sua pasta de Downloads e dê 2 cliques no arquivo .bat.</span>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2 text-xs text-zinc-300">
                <h5 className="font-bold text-zinc-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Como usar no Windows:</span>
                </h5>
                <ol className="list-decimal list-inside space-y-1 text-zinc-400 pl-1 leading-relaxed">
                  <li>Clique no botão amarelo acima para baixar <strong>Instalar_GameVault_Desktop.bat</strong>.</li>
                  <li>Abra a sua pasta <strong>Downloads</strong> e clique 2 vezes no arquivo.</li>
                  <li>Um atalho chamado <strong>GameVault</strong> será criado na sua Área de Trabalho.</li>
                  <li>Pronto! Você pode fixá-lo na sua Barra de Tarefas ou Menu Iniciar.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: Compile Standalone Electron .EXE */}
          {activeTab === 'electron' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex-shrink-0">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Compilar Instalador Nativo .EXE (Setup NSIS / Portable)
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      O projeto já inclui a estrutura <code>electron/main.cjs</code> configurada. Para gerar um instalador offline <code>GameVault-Setup.exe</code> independente na sua máquina, basta rodar os comandos abaixo:
                    </p>
                  </div>
                </div>

                {/* Code box */}
                <div className="relative rounded-xl bg-black border border-zinc-800 p-3 font-mono text-xs text-emerald-400 overflow-x-auto">
                  <button
                    onClick={handleCopyCommands}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    title="Copiar comandos"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <pre className="pr-10 whitespace-pre">{electronBuildCommands}</pre>
                </div>

                <p className="text-[11px] text-zinc-400">
                  * O instalador gerado será salvo na pasta <code>dist_electron/GameVault-Setup-1.0.0.exe</code>.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/90 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            GameVault Desktop • Compatível com Windows 10 e 11
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
