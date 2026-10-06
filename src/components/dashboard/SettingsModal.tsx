import React, { useState, useEffect } from 'react';
import { 
  Tv, MessageSquare, SunMedium, Sliders, CheckCircle2, 
  X, Sparkles, Clock, MapPin, Radio, Check
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
      <div className="w-full max-w-xl rounded-2xl bg-[#090D18] border border-[#1E293B] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#0B0F1C] border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400">
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
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 sm:px-5 pt-3 pb-2 bg-[#080C16] border-b border-[#1E293B] flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('ticker')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'ticker'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-[#111728]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Letreiro Rodapé</span>
          </button>

          <button
            onClick={() => setActiveTab('weather')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'weather'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-[#111728]'
            }`}
          >
            <SunMedium className="w-3.5 h-3.5" />
            <span>Previsão do Tempo</span>
          </button>

          <button
            onClick={() => setActiveTab('display')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'display'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-[#111728]'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Padrões da Tela</span>
          </button>
        </div>

        {/* Tab Body */}
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
                <label className="bm-label">
                  Texto da Faixa de Rodapé
                </label>
                <textarea
                  rows={3}
                  value={ticker.text}
                  onChange={(e) => setTicker({ ...ticker, text: e.target.value })}
                  placeholder="Ex: Sejam bem-vindos! Conecte-se ao nosso Wi-Fi gratuito: Rede_Loja | Aproveite as ofertas especiais no balcão hoje!"
                  className="bm-input resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="bm-label">
                    Título do Badge em Destaque
                  </label>
                  <input
                    type="text"
                    value={ticker.accentTitle || ''}
                    onChange={(e) => setTicker({ ...ticker, accentTitle: e.target.value })}
                    placeholder="Ex: COMUNICADO, PROMOÇÃO, AVISO"
                    className="bm-input font-bold"
                  />
                </div>

                <div>
                  <label className="bm-label">
                    Status do Letreiro
                  </label>
                  <button
                    type="button"
                    onClick={() => setTicker({ ...ticker, enabled: !ticker.enabled })}
                    className={`w-full py-2.5 px-3 rounded-xl border font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 ${
                      ticker.enabled
                        ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                        : 'bg-[#080C16] border-[#1E293B] text-slate-400 hover:text-white'
                    }`}
                  >
                    {ticker.enabled ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Letreiro Ativado na TV</span>
                      </>
                    ) : (
                      <span>✕ Letreiro Desativado</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Live Preview of the Ticker */}
              {ticker.text && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                    Prévia ao vivo da faixa:
                  </span>
                  <div className="h-10 rounded-xl bg-[#060810] border border-[#1E293B] flex items-center overflow-hidden">
                    <div className="px-3 py-1 bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider shrink-0 h-full flex items-center">
                      {ticker.accentTitle || 'AVISO'}
                    </div>
                    <div className="flex-1 overflow-hidden px-3 text-xs text-slate-200 truncate font-medium">
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
                  <label className="bm-label flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>Cidade da sua Loja</span>
                  </label>
                  <input
                    type="text"
                    value={weather.city}
                    onChange={(e) => setWeather({ ...weather, city: e.target.value })}
                    placeholder="Ex: São Paulo, Campinas"
                    className="bm-input"
                  />
                </div>

                <div>
                  <label className="bm-label">
                    Estado (Sigla UF)
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={weather.stateCode}
                    onChange={(e) => setWeather({ ...weather, stateCode: e.target.value.toUpperCase() })}
                    placeholder="Ex: SP, RJ, MG"
                    className="bm-input font-bold uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="bm-label">
                    Temperatura (°C)
                  </label>
                  <input
                    type="number"
                    value={weather.temp}
                    onChange={(e) => setWeather({ ...weather, temp: Number(e.target.value) })}
                    className="bm-input font-bold"
                  />
                </div>

                <div>
                  <label className="bm-label">
                    Condição do Tempo
                  </label>
                  <select
                    value={weather.condition}
                    onChange={(e) => {
                      const cond = e.target.value as any;
                      const text = cond === 'rainy' ? 'Chuvoso' : cond === 'sunny' ? 'Ensolarado' : 'Parcialmente Nublado';
                      setWeather({ ...weather, condition: cond, conditionText: text });
                    }}
                    className="bm-input"
                  >
                    <option value="partly_cloudy">Parcialmente Nublado</option>
                    <option value="sunny">Ensolarado / Céu Limpo</option>
                    <option value="rainy">Chuvoso</option>
                  </select>
                </div>

                <div>
                  <label className="bm-label">
                    Umidade (%)
                  </label>
                  <input
                    type="number"
                    value={weather.humidity}
                    onChange={(e) => setWeather({ ...weather, humidity: Number(e.target.value) })}
                    className="bm-input font-bold"
                  />
                </div>
              </div>

              {/* Weather Preview Card */}
              <div className="p-3.5 rounded-xl bg-[#0B0F1C] border border-[#1E293B] flex items-center justify-between">
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
                <label className="bm-label">
                  Nome da Empresa / Organização
                </label>
                <input
                  type="text"
                  value={config.organizationName}
                  onChange={(e) => setConfig({ ...config, organizationName: e.target.value })}
                  placeholder="Ex: Hamburgueria Silva, Salão Prime"
                  className="bm-input font-bold"
                />
              </div>

              <div>
                <label className="bm-label">
                  Modo de Layout Padrão na TV
                </label>
                <select
                  value={config.defaultLayoutMode}
                  onChange={(e) => setConfig({ ...config, defaultLayoutMode: e.target.value as TVLayoutMode })}
                  className="bm-input"
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
        <div className="p-4 sm:p-5 bg-[#0B0F1C] border-t border-[#1E293B] flex items-center justify-between">
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
              className="px-4 py-2.5 rounded-xl bg-[#141B2B] hover:bg-[#1B253B] text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition cursor-pointer"
            >
              Salvar Ajustes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
