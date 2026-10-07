import React, { useState } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Tv,
  Store,
  Layers,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBrand: () => void;
  onOpenNewScreen: () => void;
  onOpenNewSlide: () => void;
  onOpenTicker: () => void;
  onOpenWeather: () => void;
}

const TUTORIAL_STEPS = [
  {
    step: 1,
    title: '1. Identidade & Logotipo da Empresa',
    subtitle: 'Comece definindo a cara do seu estabelecimento',
    icon: Store,
    badge: 'Passo 1 de 5',
    content:
      'No menu "Marca", suba o logotipo do seu estabelecimento. O sistema extrai automaticamente as 2 cores oficiais da sua marca! Adicione também seu WhatsApp e o link padrão do QR Code que aparecerá nas TVs.',
    actionLabel: 'Abrir Configurações de Marca',
    actionType: 'brand' as const,
  },
  {
    step: 2,
    title: '2. Cadastre sua Primeira TV ou Monitor',
    subtitle: 'Identifique onde seus clientes irão assistir',
    icon: Tv,
    badge: 'Passo 2 de 5',
    content:
      'Na aba "Monitores & Telas", cadastre sua tela (ex: "TV Salão", "Menu Balcão"). Escolha a orientação: 16:9 Horizontal ou 9:16 Vertical (totem). O sistema gera um link exclusivo e um código de pareamento para o seu aparelho.',
    actionLabel: 'Cadastrar Minha TV',
    actionType: 'screen' as const,
  },
  {
    step: 3,
    title: '3. Crie e Personalize seus Slides',
    subtitle: 'Cardápios, promoções, avisos e fotos reais',
    icon: Layers,
    badge: 'Passo 3 de 5',
    content:
      'Clique em "+ Criar Slide" para subir fotos dos seus produtos ou colar URLs diretas de imagens. Defina o título, valor promocional (ex: R$ 29,90) e ative o QR Code que leva direto para seu WhatsApp ou site.',
    actionLabel: 'Criar Meu Primeiro Slide',
    actionType: 'slide' as const,
  },
  {
    step: 4,
    title: '4. Letreiro Rolante & Previsão do Tempo',
    subtitle: 'Informações ao vivo na parte inferior da TV',
    icon: Radio,
    badge: 'Passo 4 de 5',
    content:
      'Personalize o letreiro inferior da TV com avisos rápidos (ex: "Peça pelo WhatsApp • Aceitamos Pix"). Clique também na temperatura no topo para selecionar sua cidade exata e exibir o clima atualizado ao vivo.',
    actionLabel: 'Configurar Letreiro',
    actionType: 'ticker' as const,
  },
  {
    step: 5,
    title: '5. Como Transmitir na sua Smart TV',
    subtitle: 'Pronto para colocar no ar!',
    icon: ExternalLink,
    badge: 'Passo 5 de 5',
    content:
      'Para transmitir, copie o link da tela cadastrada e abra no navegador da sua Smart TV, TV Box ou Chromecast. Pressione a tecla "F" ou clique no botão de tela cheia para transmissão contínua sem bordas.',
    actionLabel: 'Entendido, Começar a Usar!',
    actionType: 'finish' as const,
  },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  onOpenBrand,
  onOpenNewScreen,
  onOpenNewSlide,
  onOpenTicker,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = TUTORIAL_STEPS[currentStepIndex];
  const IconComponent = currentStep.icon;

  const handleAction = () => {
    if (currentStep.actionType === 'brand') {
      onClose();
      onOpenBrand();
    } else if (currentStep.actionType === 'screen') {
      onClose();
      onOpenNewScreen();
    } else if (currentStep.actionType === 'slide') {
      onClose();
      onOpenNewSlide();
    } else if (currentStep.actionType === 'ticker') {
      onClose();
      onOpenTicker();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-lg rounded-2xl p-5 sm:p-6 overflow-hidden shadow-2xl border transition-colors ${
          isDark
            ? 'bg-[#0f172a] border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              {currentStep.badge}
            </span>
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Passo a Passo Interativo
            </span>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Fechar ou pular"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="flex items-center gap-1.5 pt-3.5 pb-1">
          {TUTORIAL_STEPS.map((step, idx) => (
            <button
              key={step.step}
              onClick={() => setCurrentStepIndex(idx)}
              className={`h-1.5 flex-1 rounded-full transition-all cursor-pointer ${
                idx === currentStepIndex
                  ? 'bg-sky-500'
                  : idx < currentStepIndex
                  ? 'bg-sky-800 dark:bg-sky-900'
                  : isDark
                  ? 'bg-slate-800'
                  : 'bg-slate-200'
              }`}
              title={`Ir para passo ${idx + 1}`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="py-3.5 space-y-3.5">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20 flex items-center justify-center shrink-0">
              <IconComponent className="w-5 h-5" />
            </div>

            <div className="space-y-0.5 min-w-0">
              <h3 className={`text-sm sm:text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {currentStep.title}
              </h3>
              <p className={`text-xs font-medium ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                {currentStep.subtitle}
              </p>
            </div>
          </div>

          <div
            className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
              isDark
                ? 'bg-[#152033] border-slate-800 text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            {currentStep.content}
          </div>

          {/* Direct Action Button */}
          <div className="pt-0.5">
            <button
              onClick={handleAction}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{currentStep.actionLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer Navigation */}
        <div
          className={`pt-3 border-t flex items-center justify-between gap-2 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <button
            onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentStepIndex === 0}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-20 cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Anterior</span>
          </button>

          <button
            onClick={onClose}
            className={`text-xs font-medium transition-colors cursor-pointer px-2 py-1 rounded-lg ${
              isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Pular Tutorial (Fazer Depois)
          </button>

          <button
            onClick={() =>
              setCurrentStepIndex((prev) =>
                Math.min(TUTORIAL_STEPS.length - 1, prev + 1)
              )
            }
            disabled={currentStepIndex === TUTORIAL_STEPS.length - 1}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-20 cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Próximo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
