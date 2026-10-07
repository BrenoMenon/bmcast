import React, { useState } from 'react';
import {
  X,
  Tv,
  Image as ImageIcon,
  QrCode,
  CloudSun,
  Radio,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateSlide?: () => void;
  onOpenConnectTV?: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  onOpenCreateSlide,
  onOpenConnectTV,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: '1. Crie seus Slides e Cardápios',
      badge: 'Passo 1',
      icon: ImageIcon,
      accent: '#2563EB',
      summary: 'Destaque seus pratos, preços, promoções e fotos em alta resolução.',
      points: [
        'Escolha uma imagem de fundo (use suas próprias fotos ou selecione nossos modelos em alta resolução).',
        'Defina o título do prato ou produto, descrição atrativa e preços normal e promocional.',
        'Ative o QR Code inteligente: gere automaticamente pelo link do seu WhatsApp, Instagram ou Cardápio.',
        'Escolha entre mais de 10 cores de destaque e ajuste a opacidade de fundo para máxima legibilidade.',
      ],
      action: {
        label: 'Criar Slide Agora',
        onClick: () => {
          onClose();
          onOpenCreateSlide?.();
        },
      },
    },
    {
      title: '2. Conecte com Telões ou Smart TVs',
      badge: 'Passo 2',
      icon: Tv,
      accent: '#3B82F6',
      summary: 'Sem necessidade de aparelhos caros: funciona em qualquer TV com navegador!',
      points: [
        'Acesse o botão "Conectar TV" no menu superior para visualizar o link direto e o QR Code.',
        'Abra o navegador da sua TV (Samsung Internet, LG Web Browser ou Chrome no Android TV / TV Box).',
        'Digite o link da tela ou aponte a câmera para o QR Code para abrir o player instantaneamente.',
        'Pressione o botão de tela cheia para a TV rodar 24/7 sem barras nem menus visíveis.',
      ],
      action: {
        label: 'Ver Link e QR Code da TV',
        onClick: () => {
          onClose();
          onOpenConnectTV?.();
        },
      },
    },
    {
      title: '3. Clima Oficial & Letreiro ao Vivo',
      badge: 'Passo 3',
      icon: CloudSun,
      accent: '#059669',
      summary: 'Deixe sua TV com aparência profissional de canal de notícias.',
      points: [
        'Clique no botão do Clima para selecionar sua cidade ou clique em GPS para detectar automaticamente.',
        'A TV mostra a temperatura atual, máxima, mínima e sensação climática em tempo real.',
        'Ative o letreiro rotativo no rodapé da tela para avisos relâmpago, Wi-Fi da loja ou comunicados importantes.',
        'Qualquer alteração feita no painel pelo celular ou computador atualiza a TV em tempo real!',
      ],
      action: null,
    },
    {
      title: '4. Dicas de Ouro para a sua Empresa',
      badge: 'Passo 4',
      icon: Sparkles,
      accent: '#7C3AED',
      summary: 'Boas práticas para aumentar suas vendas e engajamento no salão.',
      points: [
        'Mantenha o tempo de cada slide entre 10 e 15 segundos para dar tempo dos clientes lerem e escanearem o QR.',
        'Se você tiver totem vertical, crie telas no formato 9:16 Vertical no gerenciador de telas.',
        'Use o Modo Claro ou Modo Escuro no painel conforme sua preferência visual pelo botão no cabeçalho.',
        'Seus dados ficam 100% salvos e seguros no seu navegador e sincronizam entre telas.',
      ],
      action: null,
    },
  ];

  const activeStep = steps[currentStep];
  const StepIcon = activeStep.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-b from-blue-950/40 to-transparent border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: activeStep.accent }}
            >
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  {activeStep.badge} de {steps.length}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {activeStep.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          <p className="text-sm font-medium text-slate-200 leading-relaxed">
            {activeStep.summary}
          </p>

          <div className="space-y-3 bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4">
            {activeStep.points.map((point, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <CheckCircle2
                  className="w-4 h-4 shrink-0 mt-0.5"
                  style={{ color: activeStep.accent }}
                />
                <span className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {point}
                </span>
              </div>
            ))}
          </div>

          {activeStep.action && (
            <div className="pt-1">
              <button
                type="button"
                onClick={activeStep.action.onClick}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                style={{ backgroundColor: activeStep.accent }}
              >
                <span>{activeStep.action.label}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Footer with Step Dots and Navigation */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentStep(i)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentStep === i ? 'w-6 bg-blue-500' : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentStep === 0}
              onClick={() => setCurrentStep((c) => Math.max(0, c - 1))}
              className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                currentStep === 0
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((c) => Math.min(steps.length - 1, c + 1))}
                className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <span>Próximo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <span>Entendi, Concluir</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
