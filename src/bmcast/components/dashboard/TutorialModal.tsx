import React, { useState } from 'react';
import {
  X,
  Tv,
  Image as ImageIcon,
  CloudSun,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Sliders,
} from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateSlide?: (() => void) | undefined;
  onOpenConnectTV?: (() => void) | undefined;
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
      title: '1. Envie Suas Fotos e Artes em Alta Nitidez',
      badge: 'Passo 1',
      icon: ImageIcon,
      accent: '#2563EB',
      summary: 'Sua conta começa limpa para você exibir apenas o conteúdo real da sua marca.',
      points: [
        'Envie fotos ou artes prontas diretamente do celular ou computador mantendo a qualidade máxima.',
        'Escolha entre preencher toda a tela 16:9 ou exibir a arte inteira sem cortes.',
        'Adicione títulos, preços ou QR Code dinâmico para WhatsApp, Instagram ou Cardápio se desejar.',
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
      title: '2. Abra na TV com Link Curto ou Código',
      badge: 'Passo 2',
      icon: Tv,
      accent: '#2563EB',
      summary: 'Links curtos sem símbolos difíceis para digitar rapidamente no controle da TV.',
      points: [
        'Toque em "Conectar TV" para ver o atalho curto da sua tela (ex: seusite.com/tv1 ou seusite.com/1024).',
        'No navegador da Smart TV, basta digitar o link curto direto na barra de endereços.',
        'Você também pode personalizar o atalho curto (ex: /loja, /sala) na aba Telas & Monitores.',
      ],
      action: {
        label: 'Ver Link Curto e Código',
        onClick: () => {
          onClose();
          onOpenConnectTV?.();
        },
      },
    },
    {
      title: '3. Clima ao Vivo & Letreiro de Rodapé',
      badge: 'Passo 3',
      icon: CloudSun,
      accent: '#059669',
      summary: 'Complemente sua transmissão com informações úteis em tempo real.',
      points: [
        'Configure sua cidade no botão de Clima ou detecte via GPS em 1 toque.',
        'Ative o letreiro de rodapé apenas quando quiser exibir avisos contínuos.',
        'Qualquer ajuste feito pelo celular atualiza automaticamente na TV.',
      ],
      action: null,
    },
    {
      title: '4. Qualidade Visual para TVs e Totens',
      badge: 'Passo 4',
      icon: Sliders,
      accent: '#7C3AED',
      summary: 'Dicas práticas para uma apresentação impecável.',
      points: [
        'Quando enviar uma arte pronta que já possui texto, mantenha o escurecimento do fundo em 0% Puro.',
        'Para totens verticais, altere a orientação da tela para 9:16 Vertical na aba Telas & TVs.',
        'Tudo o que você cadastrar fica salvo exclusivamente na sua conta.',
      ],
      action: null,
    },
  ];

  const activeStep = steps[currentStep] ?? steps[0]!;
  const StepIcon = activeStep.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl sm:rounded-[2rem] border border-border bg-card text-card-foreground shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border bg-muted/30 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-xs"
              style={{ backgroundColor: activeStep.accent }}
            >
              <StepIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                {activeStep.badge} de {steps.length}
              </span>
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-foreground leading-snug">
                {activeStep.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <p className="text-xs sm:text-sm font-semibold text-foreground leading-relaxed">
            {activeStep.summary}
          </p>

          <div className="space-y-3 rounded-2xl border border-border bg-muted/40 p-4">
            {activeStep.points.map((point, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <CheckCircle2
                  className="h-4 w-4 shrink-0 mt-0.5"
                  style={{ color: activeStep.accent }}
                />
                <span className="text-xs leading-relaxed text-muted-foreground">{point}</span>
              </div>
            ))}
          </div>

          {activeStep.action && (
            <div className="pt-1">
              <button
                type="button"
                onClick={activeStep.action.onClick}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:opacity-95 transition cursor-pointer"
                style={{ backgroundColor: activeStep.accent }}
              >
                <span>{activeStep.action.label}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentStep(i)}
                aria-label={`Ir para passo ${i + 1}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentStep === i
                    ? 'w-6 bg-primary'
                    : 'w-2 bg-muted-foreground/35 hover:bg-muted-foreground/60'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentStep === 0}
              onClick={() => setCurrentStep((c) => Math.max(0, c - 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Anterior</span>
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((c) => Math.min(steps.length - 1, c + 1))}
                className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-95 transition cursor-pointer"
              >
                <span>Próximo</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-95 transition cursor-pointer"
              >
                Concluir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
