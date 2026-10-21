import React, { useState } from 'react';
import {
  Utensils,
  ShoppingBag,
  HeartPulse,
  Scissors,
  Dumbbell,
  Building2,
  GraduationCap,
  Tv,
  ArrowRight,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { BusinessCategoryType, SlideCategoryType } from '../../types/signage';

interface CompanyCategoryOnboardingModalProps {
  isOpen: boolean;
  onSelectCategory: (
    category: BusinessCategoryType,
    companyName: string,
    initialSlideCategory: SlideCategoryType
  ) => void;
  initialCompanyName?: string | undefined;
}

interface CategoryOption {
  id: BusinessCategoryType;
  title: string;
  badge: string;
  subtitle: string;
  description: string;
  initialSlideType: SlideCategoryType;
  icon: any;
  accentColor: string;
  suggestedSlogan: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    id: 'lanchonete',
    title: 'Lanchonete / Restaurante',
    badge: 'Cardápio & Preços',
    subtitle: 'Hamburguerias, Pizzarias, Bares, Cafés e Delivery',
    description: 'Foco inicial em Cardápios Digitais com fotos em alta definição, preços de combos e QR Code para WhatsApp.',
    initialSlideType: 'cardapio',
    icon: Utensils,
    accentColor: '#0284c7',
    suggestedSlogan: 'Sabor, Qualidade & Atendimento de Excelência',
  },
  {
    id: 'loja',
    title: 'Comércio / Varejo / Loja',
    badge: 'Ofertas & Descontos',
    subtitle: 'Moda, Calçados, Supermercados e Conveniências',
    description: 'Foco inicial em Promoções Relâmpago, saldões, novos lançamentos e QR Code para Instagram da loja.',
    initialSlideType: 'promo',
    icon: ShoppingBag,
    accentColor: '#e11d48',
    suggestedSlogan: 'As Melhores Ofertas e Novidades para Você',
  },
  {
    id: 'clinica',
    title: 'Clínica / Consultório / Saúde',
    badge: 'Avisos & Orientações',
    subtitle: 'Consultórios Médicos, Dentistas, Clínicas e Laboratórios',
    description: 'Foco inicial em Comunicados importantes, horários de atendimento, orientações preventivas e QR Code para agendamento.',
    initialSlideType: 'aviso',
    icon: HeartPulse,
    accentColor: '#059669',
    suggestedSlogan: 'Cuidando da Sua Saúde com Dedicação e Tecnologia',
  },
  {
    id: 'barbearia',
    title: 'Barbearia / Salão / Estética',
    badge: 'Tabela de Serviços',
    subtitle: 'Barbearias, Salões de Beleza, Spas e Esmalterias',
    description: 'Foco inicial em Tabela de Serviços e valores, fotos de cortes/transformações e QR Code para agendamento online.',
    initialSlideType: 'cardapio',
    icon: Scissors,
    accentColor: '#7c3aed',
    suggestedSlogan: 'Estilo, Cuidado e Bem-Estar no Seu Visual',
  },
  {
    id: 'academia',
    title: 'Academia / Box / Fitness',
    badge: 'Horários & Aulas',
    subtitle: 'Academias, CrossFit, Studios de Pilates e Lutas',
    description: 'Foco inicial em Grade de Aulas, comunicados de treinos, dicas de saúde e QR Code para matrícula ou app.',
    initialSlideType: 'aviso',
    icon: Dumbbell,
    accentColor: '#d97706',
    suggestedSlogan: 'Superação Diária e Saúde em Primeiro Lugar',
  },
  {
    id: 'corporativo',
    title: 'Empresa / Escritório / Indústria',
    badge: 'Mural Corporativo',
    subtitle: 'Escritórios, Fábricas, Coworkings e Startups',
    description: 'Foco inicial em Comunicação interna, boas-vindas a visitantes, avisos da diretoria e metas da equipe.',
    initialSlideType: 'mural',
    icon: Building2,
    accentColor: '#0284c7',
    suggestedSlogan: 'Conectando Pessoas, Inovação e Resultados',
  },
  {
    id: 'educacao',
    title: 'Escola / Curso / Igreja',
    badge: 'Agenda & Eventos',
    subtitle: 'Escolas, Faculdades, Cursos, Igrejas e Comunidades',
    description: 'Foco inicial em agenda de eventos, avisos para alunos ou membros, horários e QR Code para inscrições.',
    initialSlideType: 'aviso',
    icon: GraduationCap,
    accentColor: '#4f46e5',
    suggestedSlogan: 'Educação, Comunidade e Informação para Todos',
  },
  {
    id: 'outro',
    title: 'Outro Segmento / Geral',
    badge: 'Sinalização Geral',
    subtitle: 'Eventos, Hotéis, Oficinas, Pet Shops e Serviços Diversos',
    description: 'Foco em slides livres com suporte completo a avisos, fotos, vídeos e QR Codes dinâmicos.',
    initialSlideType: 'aviso',
    icon: Layers,
    accentColor: '#0284c7',
    suggestedSlogan: 'Comunicação Visual em Alta Resolução',
  },
];

export const CompanyCategoryOnboardingModal: React.FC<CompanyCategoryOnboardingModalProps> = ({
  isOpen,
  onSelectCategory,
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
      selectedOption?.initialSlideType ?? ("promo" as SlideCategoryType)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-xs font-bold text-sky-600 dark:text-sky-400">
            <Tv className="w-4 h-4" />
            <span>Configuração Inicial da sua TV Corporativa</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Qual é o ramo de atuação da sua empresa?
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
            Seu painel começa 100% limpo, sem imagens pré-carregadas. Selecione sua categoria principal para direcionar as ferramentas do seu painel.
          </p>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Company Name Input */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-2">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Nome do seu Estabelecimento / Empresa:
            </label>
            <input
              type="text"
              autoComplete="off"
              maxLength={100}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ex: Empório Central, Cantina Bella, Barbearia Alfa..."
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* Categories Grid */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Selecione o seu segmento principal:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CATEGORY_OPTIONS.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/40 shadow-sm'
                        : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                          style={{ backgroundColor: `${cat.accentColor}18`, color: cat.accentColor }}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>

                        <span
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: cat.accentColor }}
                        >
                          {cat.badge}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{cat.title}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-500 inline" />}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {cat.subtitle}
                        </p>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                        {cat.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clean Slate Assurance Banner */}
          <div className="bg-sky-50/80 dark:bg-slate-800/40 border border-sky-200 dark:border-slate-700/80 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-700 dark:text-sky-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Painel 100% Em Branco & Autonomia Completa</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Nenhuma imagem de terceiros cadastrada. Você poderá fazer upload das suas próprias fotos, definir preços reais, cadastrar o link do seu WhatsApp/cardápio e conectar com as TVs da sua loja em segundos.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
            Você poderá alterar o segmento e criar qualquer tipo de slide a qualquer momento no painel.
          </span>

          <button
            type="button"
            onClick={handleConfirm}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-full transition-all cursor-pointer shadow-md"
          >
            <span>Configurar Minha TV & Começar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
