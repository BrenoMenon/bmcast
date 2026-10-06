import React, { useState } from 'react';
import { 
  Tv, UploadCloud, Layers, CheckCircle2, 
  HelpCircle, ChevronRight, X, Sparkles, Monitor
} from 'lucide-react';

interface OnboardingGuideProps {
  onStartScreen: () => void;
  onStartMedia: () => void;
  onStartPlaylist: () => void;
  hasScreens: boolean;
  hasMedia: boolean;
  hasPlaylists: boolean;
}

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({
  onStartScreen,
  onStartMedia,
  onStartPlaylist,
  hasScreens,
  hasMedia,
  hasPlaylists,
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(hasScreens ? (hasMedia ? 3 : 2) : 1);

  if (isDismissed) {
    return (
      <div className="flex items-center justify-between p-3 rounded-xl bg-blue-950/20 border border-blue-900/40 text-xs">
        <div className="flex items-center gap-2 text-blue-300 font-medium">
          <HelpCircle className="w-4 h-4 text-blue-400" />
          <span>Primeira vez no BM Cast? Acesse o passo a passo a qualquer momento.</span>
        </div>
        <button
          onClick={() => setIsDismissed(false)}
          className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline"
        >
          Reabrir Guia de Início Rápido
        </button>
      </div>
    );
  }

  return (
    <div className="bm-card p-6 border-blue-900/40 relative overflow-hidden bg-gradient-to-r from-blue-950/20 via-slate-900/40 to-transparent">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              Guia Rápido: Como colocar o BM Cast na sua Smart TV
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Siga os 3 passos simples abaixo para exibir suas fotos, vídeos e menus na televisão.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg transition"
          title="Minimizar Guia"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 3 Step Interactive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        {/* Step 1 */}
        <div
          onClick={() => setActiveStep(1)}
          className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            activeStep === 1
              ? 'bg-[#151D2E] border-blue-500 shadow-md ring-1 ring-blue-500/30'
              : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                Passo 1
              </span>
              {hasScreens ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
                </span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-blue-500" />
              )}
            </div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <Tv className="w-4 h-4 text-blue-400" />
              <span>Cadastre sua TV</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Informe o nome e local da TV. O BM Cast gera um link exclusivo (ex: <span className="text-blue-300 font-semibold text-[11px] bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-900/40">/play/tv-salao</span>) para abrir no navegador da Smart TV.
            </p>
          </div>

          <div className="pt-3 mt-2 border-t border-slate-800">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartScreen();
              }}
              className="w-full py-1.5 px-3 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 text-xs font-semibold flex items-center justify-center gap-1 transition"
            >
              <span>{hasScreens ? 'Ver Telas' : 'Cadastrar Tela'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Step 2 */}
        <div
          onClick={() => setActiveStep(2)}
          className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            activeStep === 2
              ? 'bg-[#151D2E] border-blue-500 shadow-md ring-1 ring-blue-500/30'
              : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                Passo 2
              </span>
              {hasMedia ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
                </span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-600" />
              )}
            </div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-blue-400" />
              <span>Envie suas Mídias ou Escolha um Layout</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Arraste fotos e vídeos do seu negócio ou use os modelos prontos para personalizar com o nome e as cores da sua empresa.
            </p>
          </div>

          <div className="pt-3 mt-2 border-t border-slate-800">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartMedia();
              }}
              className="w-full py-1.5 px-3 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 text-xs font-semibold flex items-center justify-center gap-1 transition"
            >
              <span>{hasMedia ? 'Ver Mídias' : 'Enviar Fotos / Layouts'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Step 3 */}
        <div
          onClick={() => setActiveStep(3)}
          className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            activeStep === 3
              ? 'bg-[#151D2E] border-blue-500 shadow-md ring-1 ring-blue-500/30'
              : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                Passo 3
              </span>
              {hasPlaylists ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
                </span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-600" />
              )}
            </div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Vincule e Transmita</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Crie uma playlist, ajuste o tempo em segundos de cada imagem e vincule à TV. O player roda em tela cheia continuamente!
            </p>
          </div>

          <div className="pt-3 mt-2 border-t border-slate-800">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartPlaylist();
              }}
              className="w-full py-1.5 px-3 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 text-xs font-semibold flex items-center justify-center gap-1 transition"
            >
              <span>{hasPlaylists ? 'Ver Playlists' : 'Montar Playlist'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Pro tip on how to open on actual TV */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            <strong>Dica para Smart TVs (LG WebOS, Samsung Tizen, Android TV, Fire TV):</strong> Abra o navegador da TV, acesse a URL copiada da tela e clique no botão de Tela Cheia. Roda 24 horas por dia sem interrupção.
          </span>
        </div>
      </div>
    </div>
  );
};
