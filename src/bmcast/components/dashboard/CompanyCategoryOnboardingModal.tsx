import React, { useState } from 'react';
import {
  Utensils,
  ShoppingBag,
  HeartPulse,
  Scissors,
  Dumbbell,
  Building2,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Layers,
  X,
} from 'lucide-react';
import { BusinessCategoryType, SlideCategoryType } from '../../types/signage';

interface CompanyCategoryOnboardingModalProps {
  isOpen: boolean;
  onSelectCategory: (
    category: BusinessCategoryType,
    companyName: string,
    initialSlideCategory: SlideCategoryType
  ) => void;
  onClose?: (() => void) | undefined;
  initialCompanyName?: string | undefined;
}

interface CategoryOption {
  id: BusinessCategoryType;
  title: string;
  subtitle: string;
  initialSlideType: SlideCategoryType;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    id: 'lanchonete',
    title: 'Restaurante / Lanchonete',
    subtitle: 'Cardápios, bebidas, combos e pedidos rápidos',
    initialSlideType: 'cardapio',
    icon: Utensils,
    accentColor: '#2563EB',
  },
  {
    id: 'loja',
    title: 'Comércio / Varejo / Loja',
    subtitle: 'Ofertas, lançamentos e vitrine digital',
    initialSlideType: 'promo',
    icon: ShoppingBag,
    accentColor: '#E11D48',
  },
  {
    id: 'clinica',
    title: 'Clínica / Consultório / Saúde',
    subtitle: 'Orientações, avisos e sala de espera',
    initialSlideType: 'aviso',
    icon: HeartPulse,
    accentColor: '#059669',
  },
  {
    id: 'barbearia',
    title: 'Barbearia / Salão / Estética',
    subtitle: 'Tabela de serviços, valores e agendamentos',
    initialSlideType: 'cardapio',
    icon: Scissors,
    accentColor: '#7C3AED',
  },
  {
    id: 'academia',
    title: 'Academia / Studio / Fitness',
    subtitle: 'Horários de aulas, avisos e treinos',
    initialSlideType: 'aviso',
    icon: Dumbbell,
    accentColor: '#D97706',
  },
  {
    id: 'corporativo',
    title: 'Empresa / Escritório',
    subtitle: 'Comunicação interna, mural e recepção',
    initialSlideType: 'mural',
    icon: Building2,
    accentColor: '#2563EB',
  },
  {
    id: 'educacao',
    title: 'Escola / Curso / Comunidade',
    subtitle: 'Agenda de eventos, avisos e horários',
    initialSlideType: 'aviso',
    icon: GraduationCap,
    accentColor: '#4F46E5',
  },
  {
    id: 'outro',
    title: 'Outro Segmento',
    subtitle: 'Artes livres em alta definição, avisos e QR Codes',
    initialSlideType: 'mural',
    icon: Layers,
    accentColor: '#2563EB',
  },
];

export const CompanyCategoryOnboardingModal: React.FC<CompanyCategoryOnboardingModalProps> = ({
  isOpen,
  onSelectCategory,
  onClose,
  initialCompanyName = '',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategoryType>('lanchonete');
  const [companyName, setCompanyName] = useState(initialCompanyName || '');

  if (!isOpen) return null;

  const handleConfirm = () => {
    const selectedOption =
      CATEGORY_OPTIONS.find((c) => c.id === selectedCategory) || CATEGORY_OPTIONS[0];

    onSelectCategory(
      selectedCategory,
      companyName.trim(),
      selectedOption?.initialSlideType ?? 'cardapio'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative flex h-[100dvh] sm:h-auto sm:max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-none sm:rounded-[2rem] border-0 sm:border border-border bg-card text-card-foreground shadow-2xl">
        {/* Header */}
        <div className="shrink-0 flex items-start justify-between gap-3 border-b border-border bg-muted/30 px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Configuração Inicial
            </p>
            <h2 className="mt-0.5 text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
              Bem-vindo à sua conta BM CAST
            </h2>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Seu painel começa 100% em branco. Informe o nome do seu espaço e escolha seu ramo principal.
            </p>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar configuração inicial"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-5">
          <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-2">
            <label className="block text-xs font-bold text-foreground">
              Nome da sua Empresa ou Estabelecimento:
            </label>
            <input
              type="text"
              autoComplete="off"
              maxLength={100}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Digite o nome da sua empresa..."
              className="w-full rounded-2xl border border-border bg-card px-4 py-2.5 text-base sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition"
            />
          </div>

          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Segmento de atuação:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CATEGORY_OPTIONS.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/40 shadow-xs'
                        : 'border-border bg-card hover:bg-muted/50'
                    }`}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${cat.accentColor}18`, color: cat.accentColor }}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="truncate text-xs sm:text-sm font-bold text-foreground">
                          {cat.title}
                        </h4>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                        {cat.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-3.5 sm:px-6 sm:py-4">
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition cursor-pointer"
            >
              Pular agora e ir direto ao painel
            </button>
          ) : (
            <span className="text-xs text-muted-foreground text-center sm:text-left">
              Você pode editar esses dados quando quiser.
            </span>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 sm:py-2.5 text-xs sm:text-sm font-bold text-primary-foreground shadow-xs hover:opacity-95 active:scale-[0.98] transition cursor-pointer"
          >
            <span>Começar Agora</span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};
