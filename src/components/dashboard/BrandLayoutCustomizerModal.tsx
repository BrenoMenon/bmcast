import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Plus, Trash2, X, Layout, 
  Store, Palette, Utensils, 
  Flame, Scissors, Megaphone, Check, Eye, Image as ImageIcon
} from 'lucide-react';
import { storageService } from '../../services/storageService';

export interface LayoutTemplate {
  id: string;
  name: string;
  category: string;
  icon: 'utensils' | 'flame' | 'scissors' | 'megaphone' | 'image';
  description: string;
  placeholderBrand: string;
  placeholderSlogan: string;
  defaultAccent: string;
  defaultBadgeText: string;
}

export interface TopicItem {
  id: string;
  name: string;
  price: string;
  desc: string;
}

export const PRESET_TEMPLATES: LayoutTemplate[] = [
  {
    id: 'mural-slides',
    name: 'Mural de Imagens & Slides',
    category: 'Mural de Fotos & Produtos',
    icon: 'image',
    description: 'Mural com fotos de produtos, campanhas, ofertas e galeria de imagens.',
    placeholderBrand: 'Galeria Visual & Mural da Loja',
    placeholderSlogan: 'Novidades, Lançamentos e Produtos em Destaque',
    defaultAccent: '#0284C7',
    defaultBadgeText: 'MURAL DE FOTOS',
  },
  {
    id: 'menu-gourmet',
    name: 'Cardápio & Menu Comercial',
    category: 'Alimentação & Bebidas',
    icon: 'utensils',
    description: 'Pratos, lanches, porções, combos e bebidas com preços bem destacados.',
    placeholderBrand: 'Nome do Restaurante / Lanchonete',
    placeholderSlogan: 'O Melhor Sabor da Região • Atendimento de Qualidade',
    defaultAccent: '#2563EB',
    defaultBadgeText: 'CARDÁPIO',
  },
  {
    id: 'promo-dia',
    name: 'Super Promoção em Destaque',
    category: 'Varejo & Ofertas',
    icon: 'flame',
    description: 'Destaque visual gigante para produtos com desconto imperdível.',
    placeholderBrand: 'Nome da Sua Loja / Comércio',
    placeholderSlogan: 'Oferta Especial Válida Somente Hoje',
    defaultAccent: '#E11D48',
    defaultBadgeText: 'SUPER PROMOÇÃO',
  },
  {
    id: 'tabela-servicos',
    name: 'Tabela de Serviços & Valores',
    category: 'Serviços & Estética',
    icon: 'scissors',
    description: 'Barbearias, salões, clínicas, estúdios, oficinas e lava-rápidos.',
    placeholderBrand: 'Nome da Barbearia / Salão / Estúdio',
    placeholderSlogan: 'Atendimento por Ordem de Chegada ou Agendamento',
    defaultAccent: '#0D9488',
    defaultBadgeText: 'SERVIÇOS',
  },
  {
    id: 'quadro-avisos',
    name: 'Quadro Informativo & Avisos',
    category: 'Institucional & Avisos',
    icon: 'megaphone',
    description: 'Comunicados aos clientes, horários, regras, Wi-Fi e redes sociais.',
    placeholderBrand: 'Nome da Empresa / Recepção',
    placeholderSlogan: 'Horários de Atendimento & Comunicados Oficiais',
    defaultAccent: '#7C3AED',
    defaultBadgeText: 'INFORMATIVO',
  },
];

const PRESET_COLORS = [
  { name: 'Azul Real', hex: '#2563EB' },
  { name: 'Esmeralda', hex: '#059669' },
  { name: 'Vermelho Fogo', hex: '#E11D48' },
  { name: 'Roxo Imperial', hex: '#7C3AED' },
  { name: 'Âmbar Dourado', hex: '#D97706' },
  { name: 'Ciano Elétrico', hex: '#0891B2' },
  { name: 'Rosa Vibrante', hex: '#DB2777' },
  { name: 'Titânio Dark', hex: '#475569' },
];

interface BrandLayoutCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialTemplate?: LayoutTemplate;
}

export const BrandLayoutCustomizerModal: React.FC<BrandLayoutCustomizerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTemplate = PRESET_TEMPLATES[0],
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<LayoutTemplate>(initialTemplate);
  
  // Brand identity fields
  const [brandName, setBrandName] = useState('');
  const [brandSlogan, setBrandSlogan] = useState('');
  const [accentColor, setAccentColor] = useState(initialTemplate.defaultAccent || '#2563EB');
  const [footerMessage, setFooterMessage] = useState('');
  const [badgeText, setBadgeText] = useState(initialTemplate.defaultBadgeText || 'CARDÁPIO');
  
  // Dynamic Topics List
  const [topics, setTopics] = useState<TopicItem[]>([
    { id: '1', name: '', price: '', desc: '' },
    { id: '2', name: '', price: '', desc: '' },
    { id: '3', name: '', price: '', desc: '' },
  ]);

  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    if (initialTemplate) {
      setSelectedTemplate(initialTemplate);
      setAccentColor(initialTemplate.defaultAccent);
      setBadgeText(initialTemplate.defaultBadgeText);
    }
  }, [initialTemplate]);

  const handleSelectTemplate = (tpl: LayoutTemplate) => {
    setSelectedTemplate(tpl);
    setAccentColor(tpl.defaultAccent);
    setBadgeText(tpl.defaultBadgeText);
  };

  const handleTopicChange = (id: string, field: keyof TopicItem, val: string) => {
    setTopics((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: val } : t))
    );
  };

  const handleAddTopic = () => {
    const newId = `topic-${Date.now()}`;
    setTopics((prev) => [
      ...prev,
      { id: newId, name: '', price: '', desc: '' },
    ]);
  };

  const handleDeleteTopic = (id: string) => {
    setTopics((prev) => prev.filter((t) => t.id !== id));
  };

  // Draw high-resolution 1920x1080 canvas
  const renderCanvasToDataUrl = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Dark sleek gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 1920, 1080);
    bgGradient.addColorStop(0, '#07090F');
    bgGradient.addColorStop(0.5, '#0C101C');
    bgGradient.addColorStop(1, '#05070D');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1920, 1080);

    // Accent ambient glow top-left and bottom-right
    const radGlow1 = ctx.createRadialGradient(200, 150, 50, 200, 150, 500);
    radGlow1.addColorStop(0, `${accentColor}33`);
    radGlow1.addColorStop(1, 'transparent');
    ctx.fillStyle = radGlow1;
    ctx.fillRect(0, 0, 1920, 1080);

    const radGlow2 = ctx.createRadialGradient(1700, 900, 50, 1700, 900, 600);
    radGlow2.addColorStop(0, `${accentColor}25`);
    radGlow2.addColorStop(1, 'transparent');
    ctx.fillStyle = radGlow2;
    ctx.fillRect(0, 0, 1920, 1080);

    // Top Header Banner Box
    ctx.fillStyle = '#0B0F1C';
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(80, 50, 1760, 180, 24);
    ctx.fill();
    ctx.stroke();

    // Accent Stripe
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(80, 50, 16, 180, [24, 0, 0, 24]);
    ctx.fill();

    // Category / Badge Pill
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(130, 80, 220, 40, 10);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText((badgeText || selectedTemplate.category).toUpperCase(), 145, 100);

    // Brand Name
    const displayBrand = brandName.trim() || selectedTemplate.placeholderBrand;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 52px system-ui, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(displayBrand.toUpperCase(), 130, 130);

    // Brand Slogan
    const displaySlogan = brandSlogan.trim() || selectedTemplate.placeholderSlogan;
    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 24px system-ui, sans-serif';
    ctx.fillText(displaySlogan, 130, 190);

    // Live Clock indicator in Header
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 44px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 1800, 90);

    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('● TRANSMISSÃO AO VIVO', 1800, 150);
    ctx.textAlign = 'left';

    // Content Body Area
    const activeTopics = topics.filter((t) => t.name.trim() !== '');
    const displayTopics = activeTopics.length > 0 ? activeTopics : [
      { id: 'p1', name: 'Item Especial em Destaque 1', price: 'R$ 29,90', desc: 'Ingredientes nobres e preparo artesanal' },
      { id: 'p2', name: 'Item Especial em Destaque 2', price: 'R$ 39,90', desc: 'Acompanha porção e molho da casa' },
      { id: 'p3', name: 'Item Especial em Destaque 3', price: 'R$ 19,90', desc: 'Opção leve e saborosa para o seu dia' },
    ];

    if (selectedTemplate.id === 'promo-dia') {
      // Big Hero Promo Center Box
      const promoItem = displayTopics[0] || { name: 'PRODUTO EM OFERTA', price: 'R$ 49,90', desc: 'Desconto incrível exclusivo para hoje' };
      
      ctx.fillStyle = '#0D1322';
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(140, 270, 1640, 640, 32);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = accentColor;
      ctx.font = 'bold 36px system-ui, sans-serif';
      ctx.fillText('★ SUPER OFERTA DO DIA ★', 200, 340);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 84px system-ui, sans-serif';
      ctx.fillText(promoItem.name.toUpperCase(), 200, 420);

      if (promoItem.desc) {
        ctx.fillStyle = '#CBD5E1';
        ctx.font = '500 36px system-ui, sans-serif';
        ctx.fillText(promoItem.desc, 200, 530);
      }

      // Price Tag
      ctx.fillStyle = '#10B981';
      ctx.font = '900 130px system-ui, sans-serif';
      ctx.fillText(promoItem.price || 'R$ 0,00', 200, 680);

      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.fillText('Preço promocional válido enquanto durarem os estoques', 200, 830);

    } else {
      // 2-Column Responsive Items Grid
      const startY = 270;
      const cardHeight = 150;
      const gapY = 24;
      const colWidth = 860;
      const gapX = 40;

      displayTopics.slice(0, 6).forEach((item, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = 80 + col * (colWidth + gapX);
        const y = startY + row * (cardHeight + gapY);

        ctx.fillStyle = '#0C1120';
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, colWidth, cardHeight, 18);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.roundRect(x, y, 8, cardHeight, [18, 0, 0, 18]);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 36px system-ui, sans-serif';
        ctx.textBaseline = 'top';
        const truncatedName = item.name.length > 32 ? item.name.substring(0, 32) + '...' : item.name;
        ctx.fillText(truncatedName, x + 35, y + 30);

        if (item.desc) {
          ctx.fillStyle = '#94A3B8';
          ctx.font = '500 22px system-ui, sans-serif';
          const truncatedDesc = item.desc.length > 50 ? item.desc.substring(0, 50) + '...' : item.desc;
          ctx.fillText(truncatedDesc, x + 35, y + 85);
        }

        if (item.price) {
          ctx.fillStyle = '#10B981';
          ctx.font = '900 42px system-ui, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(item.price, x + colWidth - 35, y + 45);
          ctx.textAlign = 'left';
        }
      });
    }

    // Bottom Ticker / Footer Box
    ctx.fillStyle = '#080C16';
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(80, 950, 1760, 80, 20);
    ctx.fill();
    ctx.stroke();

    const displayFooter = footerMessage.trim() || '📢 Atendimento no Balcão • Conecte-se ao Wi-Fi • Siga nossas Redes';
    ctx.fillStyle = '#F8FAFC';
    ctx.font = '600 24px system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayFooter, 120, 990);

    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('BM Cast Digital Signage', 1800, 990);
    ctx.textAlign = 'left';

    return canvas.toDataURL('image/png', 1.0);
  };

  const handleSaveToMediaLibrary = async () => {
    setIsRendering(true);
    try {
      const dataUrl = renderCanvasToDataUrl();
      if (!dataUrl) return;

      const title = `${brandName.trim() || selectedTemplate.name} (${selectedTemplate.category})`;
      await storageService.addMedia({
        title,
        url: dataUrl,
        type: 'image',
        durationDefault: 12,
        dimensions: '1920x1080 (Full HD)',
        fileSize: 'Alta Definição (1080p)',
      });

      onSuccess();
      onClose();
    } finally {
      setIsRendering(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-6xl rounded-2xl bg-[#090D18] border border-[#1E293B] shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
        
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-[#1E293B] flex items-center justify-between shrink-0 bg-[#0B0F1C]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                Personalizador de Telas & Cardápios
              </h3>
              <p className="text-xs text-slate-400">
                Selecione o tipo de layout, personalize as cores e configure seus tópicos com preços.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-[#111728] hover:bg-[#1A233A] border border-[#1E293B] transition shrink-0 cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile View Toggle Switcher */}
        <div className="lg:hidden p-3 bg-[#0B0F1C] border-b border-[#1E293B] shrink-0">
          <div className="flex rounded-xl bg-[#07090E] p-1 border border-[#1E293B]">
            <button
              type="button"
              onClick={() => setMobileTab('form')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mobileTab === 'form' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>1. Configurar Dados & Tópicos</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('preview')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mobileTab === 'preview' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>2. Ver Prévia na TV</span>
            </button>
          </div>
        </div>

        {/* Main Content Area: 2 Columns */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* LEFT COLUMN: Scrollable Form Settings (7 cols) */}
          <div className={`lg:col-span-7 h-full overflow-y-auto p-4 sm:p-6 space-y-6 ${mobileTab === 'form' ? 'block' : 'hidden lg:block'}`}>
            
            {/* STEP 1: CATEGORY SELECTION CARDS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">1</span>
                  <span>Finalidade do Layout</span>
                </span>
                <span className="text-[11px] text-blue-400 font-semibold">
                  {selectedTemplate.category}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PRESET_TEMPLATES.map((tpl) => {
                  const isSelected = selectedTemplate.id === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tpl)}
                      className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                          : 'bg-[#0D1220] border-[#1E293B] hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-[#151D30] text-slate-400'}`}>
                            {tpl.icon === 'utensils' && <Utensils className="w-4 h-4" />}
                            {tpl.icon === 'flame' && <Flame className="w-4 h-4 text-rose-400" />}
                            {tpl.icon === 'scissors' && <Scissors className="w-4 h-4 text-emerald-400" />}
                            {tpl.icon === 'megaphone' && <Megaphone className="w-4 h-4 text-purple-400" />}
                            {tpl.icon === 'image' && <ImageIcon className="w-4 h-4 text-sky-400" />}
                          </div>
                          <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {tpl.name}
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {tpl.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: BRAND IDENTITY & COLORS */}
            <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-[#0B101D] border border-[#1E293B]">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">2</span>
                <span>Dados da Marca & Cores</span>
              </span>

              <div className="space-y-3.5">
                <div>
                  <label className="bm-label">
                    Nome da Empresa ou Estabelecimento *
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Ex: Hamburgueria Alpha / Barbearia Dom Pedro"
                    className="bm-input"
                  />
                </div>

                <div>
                  <label className="bm-label">
                    Slogan ou Especialidade
                  </label>
                  <input
                    type="text"
                    value={brandSlogan}
                    onChange={(e) => setBrandSlogan(e.target.value)}
                    placeholder="Ex: O Melhor Hambúrguer Artesanal da Cidade"
                    className="bm-input"
                  />
                </div>

                {/* COLOR PICKER SECTION */}
                <div className="p-3.5 rounded-xl bg-[#080C16] border border-[#1E293B] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-blue-400" />
                      <span>Cor Principal da Sua Marca</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border border-[#1E293B] bg-transparent"
                        title="Abrir seletor completo de cores"
                      />
                      <input
                        type="text"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        placeholder="#2563EB"
                        className="w-22 px-2 py-1 rounded-lg bg-[#0B0F1C] border border-[#1E293B] text-xs font-mono text-white text-center font-bold"
                      />
                    </div>
                  </div>

                  {/* Swatches */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setAccentColor(c.hex)}
                        title={c.name}
                        style={{ backgroundColor: c.hex }}
                        className={`w-7 h-7 rounded-full transition-all cursor-pointer ${
                          accentColor.toLowerCase() === c.hex.toLowerCase()
                            ? 'ring-2 ring-white scale-110 shadow-lg'
                            : 'opacity-75 hover:opacity-100 hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="bm-label">
                      Texto do Badge / Selo
                    </label>
                    <input
                      type="text"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      placeholder="Ex: CARDÁPIO, PROMOÇÃO"
                      className="bm-input font-bold"
                    />
                  </div>

                  <div>
                    <label className="bm-label">
                      Aviso de Rodapé (WhatsApp / Wi-Fi)
                    </label>
                    <input
                      type="text"
                      value={footerMessage}
                      onChange={(e) => setFooterMessage(e.target.value)}
                      placeholder="Ex: Peça no balcão • Wi-Fi Grátis"
                      className="bm-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 3: TOPICS & ITEMS (Completely redesigned, spacious and mobile-safe) */}
            <div className="space-y-3.5 p-4 sm:p-5 rounded-2xl bg-[#0B101D] border border-[#1E293B]">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">3</span>
                  <span>Tópicos & Itens ({topics.length})</span>
                </span>

                <button
                  type="button"
                  onClick={handleAddTopic}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Acrescentar Tópico</span>
                </button>
              </div>

              {/* Topics list: Clean, roomy cards with zero horizontal overflow */}
              <div className="space-y-3">
                {topics.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-[#1E293B] rounded-2xl p-4">
                    Nenhum tópico adicionado. Clique no botão acima para acrescentar itens ao seu menu.
                  </div>
                ) : (
                  topics.map((t, idx) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-xl bg-[#080C16] border border-[#1E293B] hover:border-slate-700 transition space-y-2.5 relative group"
                    >
                      {/* Row 1: Item Name (Full Width) + Delete Button */}
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#141C2E] text-slate-400 text-[11px] font-bold flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <input
                          type="text"
                          value={t.name}
                          onChange={(e) => handleTopicChange(t.id, 'name', e.target.value)}
                          placeholder={`Nome do item ${idx + 1} (ex: Cheeseburger Artesanal, Corte Degradê)`}
                          className="bm-input py-2 font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteTopic(t.id)}
                          title="Excluir este tópico"
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Row 2: Price and Description */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-1">
                          <input
                            type="text"
                            value={t.price}
                            onChange={(e) => handleTopicChange(t.id, 'price', e.target.value)}
                            placeholder="R$ 0,00"
                            className="bm-input py-2 font-black text-emerald-400 text-center"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            value={t.desc}
                            onChange={(e) => handleTopicChange(t.id, 'desc', e.target.value)}
                            placeholder="Ingredientes ou descrição curta (opcional)"
                            className="bm-input py-2 text-slate-300"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Live TV Preview (5 cols) */}
          <div className={`lg:col-span-5 h-full p-4 sm:p-6 bg-[#07090E] border-t lg:border-t-0 lg:border-l border-[#1E293B] flex flex-col justify-between overflow-y-auto ${mobileTab === 'preview' ? 'block' : 'hidden lg:flex'}`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Prévia na Smart TV (16:9 Full HD)</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  1920 × 1080p
                </span>
              </div>

              {/* 16:9 TV Display Container */}
              <div className="aspect-video w-full rounded-2xl bg-black border-2 border-[#1E293B] overflow-hidden relative shadow-2xl flex flex-col justify-between p-4 sm:p-5 select-none">
                {/* Header preview */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="min-w-0 pr-2">
                    <span
                      style={{ backgroundColor: accentColor }}
                      className="px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider inline-block mb-1"
                    >
                      {badgeText || 'CARDÁPIO'}
                    </span>
                    <h4 className="text-sm font-black text-white tracking-tight uppercase truncate">
                      {brandName.trim() || 'NOME DA SUA EMPRESA'}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate">
                      {brandSlogan.trim() || 'Seu slogan ou especialidade'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-white tabular-nums">12:30</span>
                    <span className="text-[8px] text-emerald-400 font-bold block">TV AO VIVO</span>
                  </div>
                </div>

                {/* Topics preview */}
                <div className="my-auto py-2 space-y-1.5 overflow-hidden">
                  {selectedTemplate.id === 'promo-dia' ? (
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-rose-500/60 text-center space-y-2">
                      <span className="text-xs font-black text-rose-400 block uppercase">
                        {topics[0]?.name || 'SUPER PROMOÇÃO DO DIA'}
                      </span>
                      <p className="text-[10px] text-slate-300 line-clamp-2">
                        {topics[0]?.desc || 'Condição especial por tempo limitado'}
                      </p>
                      <div className="text-xl font-black text-emerald-400">
                        {topics[0]?.price || 'R$ 0,00'}
                      </div>
                    </div>
                  ) : topics.length === 0 ? (
                    <div className="text-center py-4 text-slate-600 text-xs">
                      Nenhum tópico adicionado ainda
                    </div>
                  ) : (
                    topics.slice(0, 5).map((it, i) => (
                      <div
                        key={it.id || i}
                        className="flex items-center justify-between p-2 rounded-lg bg-[#0C1220]/80 border border-slate-800 text-[11px]"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-white block truncate">
                            {it.name || `Item ${i + 1}`}
                          </span>
                          {it.desc && (
                            <span className="text-[9px] text-slate-400 block truncate">
                              {it.desc}
                            </span>
                          )}
                        </div>
                        {it.price && (
                          <span
                            style={{ borderColor: accentColor }}
                            className="px-2 py-0.5 rounded bg-black font-extrabold text-emerald-400 text-xs shrink-0 border"
                          >
                            {it.price}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Footer preview */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400">
                  <span className="truncate pr-2">
                    📢 {footerMessage.trim() || 'Avisos aos clientes • Peça no balcão ou WhatsApp'}
                  </span>
                  <span className="shrink-0 text-blue-400 font-bold">BM Cast</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions for Desktop Right Column */}
            <div className="pt-4 border-t border-[#1E293B] hidden lg:flex items-center justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-[#141B2B] hover:bg-[#1B253B] text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={isRendering}
                onClick={handleSaveToMediaLibrary}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-900/40 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isRendering ? 'Gerando Imagem...' : 'Salvar e Exibir na TV'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Bottom Actions Footer Bar (Always Visible on Mobile and Tablet) */}
        <div className="lg:hidden p-3.5 bg-[#0B0F1C] border-t border-[#1E293B] flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#141B2B] hover:bg-[#1B253B] text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={isRendering}
            onClick={handleSaveToMediaLibrary}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-900/40 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isRendering ? 'Gerando...' : 'Salvar e Exibir na TV'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
