import React, { useState, useEffect } from 'react';
import { 
  Tv, MessageSquare, SunMedium, Sliders, CheckCircle2, 
  X, Sparkles, Clock, MapPin, Radio
} from 'lucide-react';
import { SystemConfig, TickerConfig, WeatherConfig, TVLayoutMode } from '../../types/signage';
import { storageService } from '../../services/storageService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onRefresh,
}) => {
  // Starts directly on TV Ticker - never black, never database/json
  const [activeTab, setActiveTab] = useState<'ticker' | 'weather' | 'display'>('ticker');

  const [config, setConfig] = useState<SystemConfig>({
    supabaseUrl: 'https://dkjjgszyrkhdcrwycaej.supabase.co',
    supabaseAnonKey: 'sb_publishable_kyAFAx-RJG9MTLjTMmySTw_qoIqy9bD',
    isSupabaseConfigured: true,
    organizationName: 'BM Cast',
    themeAccent: '#3B82F6',
    themeMode: 'dark',
    defaultLayoutMode: 'clean_media',
    enableSplitMode: true,
  });

  const [ticker, setTicker] = useState<TickerConfig>({
    enabled: true,
    text: '',
    speed: 'normal',
    accentTitle: 'COMUNICADO',
  });

  const [weather, setWeather] = useState<WeatherConfig>({
    city: 'São Paulo',
    stateCode: 'SP',
    temp: 24,
    condition: 'partly_cloudy',
    conditionText: 'Parcialmente Nublado',
    humidity: 58,
    windKmH: 12,
    tempMin: 18,
    tempMax: 26,
  });

  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      const [c, t, w] = await Promise.all([
        storageService.getConfig(),
        storageService.getTicker(),
        storageService.getWeather(),
      ]);
      setConfig(c);
      setTicker(t);
      setWeather(w);
    };
    load();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();

    await Promise.all([
      storageService.updateTicker(ticker),
      storageService.updateWeather(weather),
      storageService.updateConfig(config),
    ]);

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onRefresh();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-[#0E1322] border border-[#222E46] shadow-2xl shadow-blue-950/50 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Luminous Clean Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#141B2E] via-[#101627] to-[#0E1322] border-b border-[#222E46] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Ajustes da Smart TV
              </h3>
              <p className="text-xs text-slate-400">
                Configure o letreiro de notícias, clima e padrões de exibição das telas.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clean Responsive Tab Switcher */}
        <div className="px-4 sm:px-5 pt-3 pb-2 bg-[#0C101C] border-b border-[#1E293B] flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('ticker')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'ticker'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-[#141B2E]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Letreiro Rodapé</span>
          </button>

          <button
            onClick={() => setActiveTab('weather')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'weather'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-[#141B2E]'
            }`}
          >
            <SunMedium className="w-3.5 h-3.5" />
            <span>Previsão do Tempo</span>
          </button>

          <button
            onClick={() => setActiveTab('display')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'display'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-[#141B2E]'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Padrões da Tela</span>
          </button>
        </div>

        {/* Tab Body (High contrast, clearly visible, zero pitch-black darkness) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* TAB 1: LETREIRO & FAIXA DE AVISOS */}
          {activeTab === 'ticker' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-800/40 space-y-1">
                <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                  <span>Letreiro Contínuo na TV</span>
                </span>
                <p className="text-[11px] text-slate-300">
                  Esta mensagem corre suavemente no rodapé da Smart TV, excelente para avisos, promoções do dia, Wi-Fi e recados aos clientes.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1.5">
                  Texto da Faixa de Rodapé
                </label>
                <textarea
                  rows={4}
                  value={ticker.text}
                  onChange={(e) => setTicker({ ...ticker, text: e.target.value })}
                  placeholder="Ex: Sejam bem-vindos! Conecte-se ao nosso Wi-Fi gratuito: Rede_Loja | Aproveite as ofertas especiais no balcão hoje!"
                  className="w-full p-3 rounded-xl bg-[#141B2D] border border-[#263552] text-slate-100 placeholder:text-slate-500 text-xs leading-relaxed focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-200 mb-1.5">
                    Título do Badge em Destaque
                  </label>
                  <input
                    type="text"
                    value={ticker.accentTitle || ''}
                    onChange={(e) => setTicker({ ...ticker, accentTitle: e.target.value })}
                    placeholder="Ex: COMUNICADO, PROMOÇÃO, AVISO"
                    className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#263552] text-slate-100 text-xs font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1.5">
                    Status do Letreiro
                  </label>
                  <button
                    type="button"
                    onClick={() => setTicker({ ...ticker, enabled: !ticker.enabled })}
                    className={`w-full py-2 px-3 rounded-xl border font-bold text-xs transition ${
                      ticker.enabled
                        ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400'
                    }`}
                  >
                    {ticker.enabled ? '✓ Letreiro Ativado na TV' : '✕ Letreiro Desativado'}
                  </button>
                </div>
              </div>

              {/* Live Preview of the Ticker */}
              {ticker.text && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">
                    Prévia ao vivo da faixa:
                  </span>
                  <div className="h-9 rounded-xl bg-[#090D18] border border-[#1E293B] flex items-center overflow-hidden">
                    <div className="px-2.5 py-1 bg-blue-600 text-white font-black text-[9px] uppercase tracking-wider shrink-0">
                      {ticker.accentTitle || 'AVISO'}
                    </div>
                    <div className="flex-1 overflow-hidden px-3 text-xs text-slate-200 truncate">
                      {ticker.text}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PREVISÃO DO TEMPO */}
          {activeTab === 'weather' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-800/40 space-y-1">
                <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <SunMedium className="w-3.5 h-3.5 text-amber-400" />
                  <span>Clima e Temperatura Exibidos na TV</span>
                </span>
                <p className="text-[11px] text-slate-300">
                  Nos layouts corporativos e informativos, a Smart TV exibe a previsão do tempo em tempo real para os clientes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-200 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-400" />
                    <span>Cidade da sua Loja</span>
                  </label>
                  <input
                    type="text"
                    value={weather.city}
                    onChange={(e) => setWeather({ ...weather, city: e.target.value })}
                    placeholder="Ex: São Paulo, Rio de Janeiro"
                    className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#263552] text-slate-100 text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1.5">
                    Estado (Sigla UF)
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={weather.stateCode}
                    onChange={(e) => setWeather({ ...weather, stateCode: e.target.value.toUpperCase() })}
                    placeholder="Ex: SP, RJ, MG, PR"
                    className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#263552] text-slate-100 text-xs font-bold uppercase focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-200 mb-1.5">
                    Temperatura (°C)
                  </label>
                  <input
                    type="number"
                    value={weather.temp}
                    onChange={(e) => setWeather({ ...weather, temp: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#263552] text-slate-100 text-xs font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1.5">
                    Condição
                  </label>
                  <select
                    value={weather.condition}
                    onChange={(e) => {
                      const cond = e.target.value as any;
                      const text = cond === 'rainy' ? 'Chuvoso' : cond === 'sunny' ? 'Ensolarado' : 'Parcialmente Nublado';
                      setWeather({ ...weather, condition: cond, conditionText: text });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#263552] text-slate-100 text-xs font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="partly_cloudy">Parcialmente Nublado</option>
                    <option value="sunny">Ensolarado / Céu Limpo</option>
                    <option value="rainy">Chuvoso</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1.5">
                    Umidade (%)
                  </label>
                  <input
                    type="number"
                    value={weather.humidity}
                    onChange={(e) => setWeather({ ...weather, humidity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#263552] text-slate-100 text-xs font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Weather Preview Card */}
              <div className="p-3.5 rounded-xl bg-[#131A2B] border border-[#222E46] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    {weather.city || 'Sua Cidade'} - {weather.stateCode || 'UF'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {weather.conditionText} • Umidade {weather.humidity}%
                  </span>
                </div>
                <div className="text-2xl font-black text-white">
                  {weather.temp}°C
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PADRÕES DA TELA */}
          {activeTab === 'display' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-800/40 space-y-1">
                <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-blue-400" />
                  <span>Configurações Padrão de Exibição</span>
                </span>
                <p className="text-[11px] text-slate-300">
                  Defina o comportamento das Smart TVs conectadas ao seu negócio.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1.5">
                  Nome da Empresa / Organização
                </label>
                <input
                  type="text"
                  value={config.organizationName}
                  onChange={(e) => setConfig({ ...config, organizationName: e.target.value })}
                  placeholder="Ex: Hamburgueria Silva, Salão Prime"
                  className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#263552] text-slate-100 text-xs font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1.5">
                  Modo de Layout Padrão na TV
                </label>
                <select
                  value={config.defaultLayoutMode}
                  onChange={(e) => setConfig({ ...config, defaultLayoutMode: e.target.value as TVLayoutMode })}
                  className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#263552] text-slate-100 text-xs font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="clean_media">Somente Imagens (100% Tela Cheia Limpa)</option>
                  <option value="menu_brand">Cardápio / Menu com Logotipo e Horário</option>
                  <option value="corporate_split">Corporativo com Relógio e Clima (75/25)</option>
                  <option value="promo_qr">Promocional com QR Code no Rodapé</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Clean Footer */}
        <div className="p-4 sm:p-5 bg-[#0C101C] border-t border-[#1E293B] flex items-center justify-between">
          <div>
            {saveSuccess && (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ajustes salvos com sucesso!</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition"
            >
              Salvar Ajustes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
