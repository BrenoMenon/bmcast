import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Check, X, Download, Layout, 
  Store, Palette, DollarSign, Image as ImageIcon, QrCode
} from 'lucide-react';
import { storageService } from '../../services/storageService';

export interface LayoutTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  placeholderBrand: string;
  placeholderSlogan: string;
  defaultAccent: string;
  defaultBadgeText: string;
}

export const PRESET_TEMPLATES: LayoutTemplate[] = [
  {
    id: 'menu-gourmet',
    name: 'Cardápio & Menu Comercial',
    category: 'Alimentação & Bebidas',
    description: 'Ideal para lanchonetes, restaurantes, cafeterias e hamburguerias. Exibe pratos com preços e avisos de pedidos.',
    placeholderBrand: 'Nome do seu Restaurante ou Lanchonete',
    placeholderSlogan: 'Slogan ou especialidade da casa',
    defaultAccent: '#2563EB',
    defaultBadgeText: 'CARDÁPIO',
  },
  {
    id: 'promo-dia',
    name: 'Promoção em Destaque',
    category: 'Varejo & Ofertas',
    description: 'Destaque visual gigante para produtos com desconto imperdível, preço especial e chamada de balcão.',
    placeholderBrand: 'Nome da sua Loja ou Comércio',
    placeholderSlogan: 'Oferta especial válida hoje',
    defaultAccent: '#E11D48',
    defaultBadgeText: 'PROMOÇÃO',
  },
  {
    id: 'tabela-servicos',
    name: 'Tabela de Serviços & Valores',
    category: 'Serviços & Estética',
    description: 'Perfeito para barbearias, salões de beleza, clínicas, lava-rápidos, oficinas e estúdios.',
    placeholderBrand: 'Nome do Estabelecimento / Barbearia',
    placeholderSlogan: 'Atendimento com horário ou por ordem de chegada',
    defaultAccent: '#0D9488',
    defaultBadgeText: 'SERVIÇOS',
  },
  {
    id: 'quadro-avisos',
    name: 'Quadro Informativo & Avisos',
    category: 'Institucional & Avisos',
    description: 'Comunicados aos clientes, horários de atendimento, regras da loja, Wi-Fi e redes sociais.',
    placeholderBrand: 'Nome da Empresa / Recepção',
    placeholderSlogan: 'Horários de Atendimento & Comunicados',
    defaultAccent: '#7C3AED',
    defaultBadgeText: 'INFORMATIVO',
  },
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
  
  // ALL INPUTS START COMPLETELY EMPTY PER USER REQUEST:
  // "na marca da empresa ja tem varias coisas preenhcidas deixe tudo sem preecnher"
  const [brandName, setBrandName] = useState('');
  const [brandSlogan, setBrandSlogan] = useState('');
  const [accentColor, setAccentColor] = useState(initialTemplate.defaultAccent || '#2563EB');
  const [footerMessage, setFooterMessage] = useState('');
  const [badgeText, setBadgeText] = useState(initialTemplate.defaultBadgeText || 'DESTAQUE');
  
  // 4 clean blank item rows with placeholders
  const [items, setItems] = useState([
    { name: '', price: '', desc: '' },
    { name: '', price: '', desc: '' },
    { name: '', price: '', desc: '' },
    { name: '', price: '', desc: '' },
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

  const handleItemChange = (index: number, field: 'name' | 'price' | 'desc', val: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  };

  // Draw high-resolution 1920x1080 canvas
  const renderCanvasToDataUrl = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Dark sleek background
    const bgGradient = ctx.createLinearGradient(0, 0, 1920, 1080);
    bgGradient.addColorStop(0, '#07090F');
    bgGradient.addColorStop(0.5, '#0B0F19');
    bgGradient.addColorStop(1, '#05070B');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1920, 1080);

    // Accent ambient glow in top-left
    const glow1 = ctx.createRadialGradient(250, 150, 20, 250, 150, 600);
    glow1.addColorStop(0, accentColor + '33');
    glow1.addColorStop(1, 'transparent');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, 1920, 600);

    // Header container with border
    ctx.fillStyle = '#0F1424E6';
    ctx.fillRect(80, 60, 1760, 160);
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.strokeRect(80, 60, 1760, 160);

    // Top Brand Badge
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(110, 85, 240, 32, 6);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText((badgeText || 'DESTAQUE').toUpperCase(), 130, 107);

    // Brand Name
    const displayBrand = brandName.trim() || selectedTemplate.placeholderBrand;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 48px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(displayBrand.toUpperCase(), 110, 175);

    // Slogan / Subtitle
    const displaySlogan = brandSlogan.trim() || selectedTemplate.placeholderSlogan;
    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(displaySlogan, 110, 205);

    // Right side live badge
    ctx.fillStyle = accentColor + '20';
    ctx.beginPath();
    ctx.roundRect(1560, 95, 240, 90, 12);
    ctx.fill();
    ctx.strokeStyle = accentColor + '60';
    ctx.strokeRect(1560, 95, 240, 90);

    ctx.fillStyle = '#60A5FA';
    ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('BM CAST DIGITAL', 1600, 130);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('TRANSMISSÃO', 1600, 162);

    // Items Section
    const startY = 260;
    const availableHeight = 680;
    const activeItems = items.filter((it) => it.name.trim() || it.price.trim());
    const renderItems = activeItems.length > 0 ? activeItems : [
      { name: 'Item / Produto 1', price: 'R$ 0,00', desc: 'Descrição dos ingredientes ou detalhes do serviço' },
      { name: 'Item / Produto 2', price: 'R$ 0,00', desc: 'Descrição dos ingredientes ou detalhes do serviço' },
      { name: 'Item / Produto 3', price: 'R$ 0,00', desc: 'Descrição dos ingredientes ou detalhes do serviço' },
    ];

    if (selectedTemplate.id === 'promo-dia') {
      // Big promotional single item layout
      const promoItem = renderItems[0];
      ctx.fillStyle = '#10172AE6';
      ctx.fillRect(80, startY, 1760, 670);
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 4;
      ctx.strokeRect(80, startY, 1760, 670);

      ctx.fillStyle = accentColor;
      ctx.font = '900 64px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(promoItem?.name || 'PROMOÇÃO DO DIA', 140, 390);

      ctx.fillStyle = '#CBD5E1';
      ctx.font = '500 32px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(promoItem?.desc || 'Condição especial por tempo limitado no estabelecimento', 140, 470);

      // Price Tag Box
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.roundRect(140, 550, 750, 220, 24);
      ctx.fill();
      ctx.strokeStyle = '#22C55E';
      ctx.lineWidth = 4;
      ctx.strokeRect(140, 550, 750, 220);

      ctx.fillStyle = '#22C55E';
      ctx.font = '900 110px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(promoItem?.price || 'R$ 0,00', 180, 700);

      // Call to action button box
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.roundRect(960, 600, 800, 130, 20);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 38px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('PEÇA DIRETO NO BALCÃO', 1080, 680);
    } else {
      // Multi-item grid layout
      const count = renderItems.length;
      const itemH = Math.min(150, Math.floor(availableHeight / count) - 15);

      renderItems.forEach((item, idx) => {
        const y = startY + idx * (itemH + 18);

        ctx.fillStyle = '#0F1526CC';
        ctx.beginPath();
        ctx.roundRect(80, y, 1760, itemH, 12);
        ctx.fill();
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(80, y, 1760, itemH);

        // Indicator bar on left
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.roundRect(80, y, 8, itemH, 4);
        ctx.fill();

        // Item Name
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 28px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(item.name || `Item ${idx + 1}`, 120, y + 48);

        // Item Description
        if (item.desc) {
          ctx.fillStyle = '#94A3B8';
          ctx.font = '400 20px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(item.desc, 120, y + 88);
        }

        // Price badge pill
        ctx.fillStyle = accentColor + '25';
        ctx.beginPath();
        ctx.roundRect(1480, y + 25, 320, itemH - 50, 12);
        ctx.fill();
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(1480, y + 25, 320, itemH - 50);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '800 36px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(item.price || 'R$ 0,00', 1480 + 160, y + itemH / 2 + 12);
        ctx.textAlign = 'left';
      });
    }

    // Bottom Footer Ticker Bar
    const displayFooter = footerMessage.trim() || 'Avisos aos clientes • Peça no balcão ou consulte nosso atendimento';
    ctx.fillStyle = '#090D18';
    ctx.fillRect(0, 990, 1920, 90);
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 990);
    ctx.lineTo(1920, 990);
    ctx.stroke();

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('📢 ' + displayFooter, 80, 1045);

    return canvas.toDataURL('image/png');
  };

  const handleSaveToMediaLibrary = async () => {
    setIsRendering(true);
    try {
      const dataUrl = renderCanvasToDataUrl();
      const titleName = brandName.trim() || 'Layout Personalizado';

      await storageService.addMedia({
        title: `${titleName} - ${selectedTemplate.name}`,
        type: 'image',
        url: dataUrl,
        thumbnail: dataUrl,
        durationDefault: 12,
        category: 'cardapio',
        dimensions: '1920x1080 (Full HD)',
        fileSize: 'Layout Renderizado',
      });

      onSuccess();
      onClose();
    } catch (e) {
      console.error('Erro ao renderizar layout:', e);
    } finally {
      setIsRendering(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bm-card w-full max-w-5xl p-5 sm:p-7 space-y-5 max-h-[95vh] flex flex-col shadow-2xl overflow-hidden border-[#232F46]">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#1E293B]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Personalizador de Layout com a Marca da Empresa
              </h3>
              <p className="text-xs text-slate-400">
                Preencha o nome do seu negócio, pratos e preços nos campos em branco abaixo e gere a arte para a TV.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Picker Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {PRESET_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => handleSelectTemplate(tpl)}
              className={`shrink-0 px-3 py-2 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
                selectedTemplate.id === tpl.id
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-[#0E131F] text-slate-300 border-[#1E293B] hover:border-slate-700'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>{tpl.name}</span>
            </button>
          ))}
        </div>

        {/* Mobile View Toggle between Form and TV Preview */}
        <div className="lg:hidden flex items-center bg-[#0C101C] p-1 rounded-xl border border-[#1E293B]">
          <button
            type="button"
            onClick={() => setMobileTab('form')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              mobileTab === 'form' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Editar Dados da Marca
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              mobileTab === 'preview' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Ver Prévia na TV (16:9)
          </button>
        </div>

        {/* Main Body: 2 Columns (Editor vs Live Preview) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-y-auto pr-1">
          {/* Left Column: Clean Form Customization (5 cols) */}
          <div className={`lg:col-span-5 space-y-4 ${mobileTab === 'form' ? 'block' : 'hidden lg:block'}`}>
            <div className="p-4 rounded-xl bg-[#0A0D15] border border-[#1E293B] space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-blue-400" />
                <span>Identidade da Sua Marca</span>
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome da Empresa / Estabelecimento *
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Ex: Hamburgueria Silva, Salão Prime, Bar do Pedro"
                  className="bm-input w-full px-3 py-2 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Slogan ou Subtítulo
                </label>
                <input
                  type="text"
                  value={brandSlogan}
                  onChange={(e) => setBrandSlogan(e.target.value)}
                  placeholder="Ex: O Melhor Hambúrguer da Cidade • Desde 2021"
                  className="bm-input w-full px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Texto do Badge
                  </label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="Ex: CARDÁPIO, OFERTA"
                    className="bm-input w-full px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Palette className="w-3 h-3 text-blue-400" />
                    <span>Cor da Marca</span>
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {['#2563EB', '#E11D48', '#0D9488', '#7C3AED', '#D97706'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setAccentColor(color)}
                        style={{ backgroundColor: color }}
                        className={`w-6 h-6 rounded-full transition-all ${
                          accentColor === color ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mensagem de Rodapé (WhatsApp / Avisos / Wi-Fi)
                </label>
                <input
                  type="text"
                  value={footerMessage}
                  onChange={(e) => setFooterMessage(e.target.value)}
                  placeholder="Ex: Peça pelo WhatsApp (11) 98765-4321 • Wi-Fi Grátis"
                  className="bm-input w-full px-3 py-2 text-xs"
                />
              </div>
            </div>

            {/* Items customization (blank inputs ready to fill) */}
            <div className="p-4 rounded-xl bg-[#0A0D15] border border-[#1E293B] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pratos, Produtos ou Serviços</span>
              </h4>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-[#0E1424] border border-[#1E293B] space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                        placeholder={`Nome do item ${idx + 1} (ex: Smash Burguer)`}
                        className="bm-input flex-1 px-2.5 py-1.5 text-xs font-medium"
                      />
                      <input
                        type="text"
                        value={item.price}
                        onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                        placeholder="R$ 0,00"
                        className="bm-input w-24 px-2.5 py-1.5 text-xs text-center font-bold text-emerald-400"
                      />
                    </div>
                    <input
                      type="text"
                      value={item.desc}
                      onChange={(e) => handleItemChange(idx, 'desc', e.target.value)}
                      placeholder="Descrição dos ingredientes ou detalhes (opcional)"
                      className="bm-input w-full px-2.5 py-1 text-[11px] text-slate-400"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live Simulated Preview on 16:9 TV (7 cols) */}
          <div className={`lg:col-span-7 flex-col justify-between space-y-3 ${mobileTab === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
            <div>
              <div className="flex items-center justify-between pb-1.5">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Prévia em Tempo Real (Smart TV 16:9)</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Full HD 1080p
                </span>
              </div>

              {/* 16:9 Preview Frame */}
              <div className="aspect-video w-full rounded-xl bg-black border-2 border-[#1E293B] overflow-hidden relative shadow-2xl flex flex-col justify-between p-4 sm:p-5 select-none">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <div>
                    <span
                      style={{ backgroundColor: accentColor }}
                      className="px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider inline-block mb-1"
                    >
                      {badgeText || 'DESTAQUE'}
                    </span>
                    <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight uppercase">
                      {brandName.trim() || 'SUA EMPRESA AQUI'}
                    </h2>
                    <p className="text-[10px] text-slate-400">
                      {brandSlogan.trim() || 'Seu slogan ou especialidade'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-white tabular-nums">12:30</span>
                    <span className="text-[9px] text-slate-400 block">TV ATIVA</span>
                  </div>
                </div>

                {/* Content preview */}
                <div className="my-auto py-2 space-y-2">
                  {selectedTemplate.id === 'promo-dia' ? (
                    <div className="p-3 rounded-lg bg-slate-900/80 border border-rose-500/60 text-center space-y-2">
                      <span className="text-xs font-extrabold text-rose-400 block uppercase">
                        {items[0]?.name || 'PRODUTO EM DESTAQUE'}
                      </span>
                      <p className="text-[10px] text-slate-300">
                        {items[0]?.desc || 'Descrição da promoção do seu comércio'}
                      </p>
                      <div className="text-2xl font-black text-emerald-400">
                        {items[0]?.price || 'R$ 0,00'}
                      </div>
                    </div>
                  ) : (
                    items.map((it, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px]"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-white block truncate">
                            {it.name || `Nome do item ${i + 1}`}
                          </span>
                          <span className="text-[9px] text-slate-400 block truncate">
                            {it.desc || 'Ingredientes ou detalhes'}
                          </span>
                        </div>
                        <span
                          style={{ borderColor: accentColor }}
                          className="px-2 py-0.5 rounded bg-slate-950 font-bold text-white text-xs shrink-0 border"
                        >
                          {it.price || 'R$ 0,00'}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer preview */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400">
                  <span className="truncate">
                    📢 {footerMessage.trim() || 'Avisos aos clientes • Peça pelo balcão ou WhatsApp'}
                  </span>
                  <span className="shrink-0 text-blue-400 font-semibold ml-2">BM Cast TV</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-[#1E293B] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[#141B2B] hover:bg-[#1B253B] text-slate-300 text-xs font-semibold transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={isRendering}
                onClick={handleSaveToMediaLibrary}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isRendering ? 'Gerando Imagem...' : 'Salvar e Adicionar à TV'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
