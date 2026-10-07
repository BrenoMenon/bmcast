import React, { useState } from 'react';
import {
  X,
  Search,
  Check,
  RefreshCw,
  MapPin,
  Wind,
  Droplets,
  Compass,
} from 'lucide-react';
import { WeatherConfig } from '../../types/signage';
import { weatherService, POPULAR_CITIES, CitySearchResult } from '../../services/weatherService';
import { useTheme } from '../../context/ThemeContext';

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeather: WeatherConfig;
  onSave: (weather: WeatherConfig) => void;
}

export const WeatherModal: React.FC<WeatherModalProps> = ({
  isOpen,
  onClose,
  currentWeather,
  onSave,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CitySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [selectedWeather, setSelectedWeather] = useState<WeatherConfig>(currentWeather);

  if (!isOpen) return null;

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await weatherService.searchCities(query);
      setSearchResults(results);
    } catch (e) {
      console.warn('Erro ao pesquisar:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCity = async (
    cityName: string,
    stateCode: string,
    lat: number,
    lon: number
  ) => {
    setIsLoadingWeather(true);
    try {
      const live = await weatherService.fetchLiveWeather(lat, lon, cityName, stateCode);
      setSelectedWeather(live);
      setSearchResults([]);
      setSearchQuery('');
    } catch (e) {
      console.error('Erro ao buscar dados da cidade:', e);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const handleDetectGPS = async () => {
    setIsLoadingWeather(true);
    try {
      const coords = await weatherService.detectBrowserLocation();
      if (coords) {
        const live = await weatherService.fetchLiveWeather(
          coords.lat,
          coords.lon,
          'Local Atual',
          'GPS'
        );
        setSelectedWeather(live);
      }
    } catch (e) {
      console.warn('GPS não acessível:', e);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const handleRefreshCurrent = async () => {
    setIsLoadingWeather(true);
    try {
      const live = await weatherService.fetchLiveWeather(
        selectedWeather.latitude,
        selectedWeather.longitude,
        selectedWeather.city,
        selectedWeather.stateCode
      );
      setSelectedWeather(live);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const handleConfirm = () => {
    onSave(selectedWeather);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-lg rounded-2xl p-6 overflow-hidden max-h-[92vh] flex flex-col shadow-2xl border transition-colors ${
          isDark
            ? 'bg-[#0f172a] border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between pb-3.5 border-b ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div>
            <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Previsão do Tempo na TV
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Atualização automática em tempo real via Open-Meteo
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Live Weather Preview Card */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border relative overflow-hidden transition-colors ${
              isDark
                ? 'bg-[#0b1120] border-slate-800'
                : 'bg-slate-50 border-slate-200 shadow-xs'
            }`}
          >
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                onClick={handleRefreshCurrent}
                disabled={isLoadingWeather}
                className={`px-3 py-1.5 rounded-full border text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
                }`}
                title="Atualizar agora via API"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWeather ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-bold text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {selectedWeather.city}
                    {selectedWeather.stateCode ? `, ${selectedWeather.stateCode}` : ''}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className={`text-4xl sm:text-5xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {selectedWeather.temp}°C
                  </span>
                  <span className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {selectedWeather.conditionText}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                  <span>Mín: {selectedWeather.tempMin}°C</span>
                  <span>•</span>
                  <span>Máx: {selectedWeather.tempMax}°C</span>
                </div>
              </div>

              <div
                className={`grid grid-cols-2 gap-3 p-3 rounded-xl border text-xs ${
                  isDark ? 'bg-[#152033] border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-sky-500 shrink-0" />
                  <div>
                    <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Umidade</div>
                    <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedWeather.humidity}%</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-sky-500 shrink-0" />
                  <div>
                    <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Vento</div>
                    <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedWeather.windKmH} km/h</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search City Input */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Buscar cidade (ex: Curitiba, Campinas, Santos)..."
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-full text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30 ${
                    isDark
                      ? 'bg-[#0b1120] border-slate-700 text-white placeholder-slate-500 focus:border-sky-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-600'
                  }`}
                />
                {isSearching && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    <RefreshCw className="w-4 h-4 text-sky-500 animate-spin" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleDetectGPS}
                className={`px-4 py-2.5 border rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                }`}
              >
                <Compass className="w-4 h-4 text-sky-500" />
                <span>GPS</span>
              </button>
            </div>

            {/* Search Dropdown Results */}
            {searchResults.length > 0 && (
              <div
                className={`max-h-48 overflow-y-auto border rounded-2xl divide-y shadow-xl ${
                  isDark ? 'bg-[#0b1120] border-slate-800 divide-slate-800' : 'bg-white border-slate-200 divide-slate-100'
                }`}
              >
                {searchResults.map((city) => (
                  <div
                    key={`${city.id}-${city.name}`}
                    onClick={() =>
                      handleSelectCity(
                        city.name,
                        city.admin1 || city.country_code,
                        city.latitude,
                        city.longitude
                      )
                    }
                    className={`p-3 cursor-pointer flex items-center justify-between text-xs transition-colors ${
                      isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span className="font-semibold">{city.name}</span>
                      <span className="text-slate-400">
                        {city.admin1 ? `(${city.admin1})` : ''} - {city.country}
                      </span>
                    </div>
                    <span className="text-sky-600 dark:text-sky-400 font-semibold text-[11px]">Selecionar</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Popular Cities */}
            <div>
              <label className={`block text-xs font-semibold mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Capitais e Cidades Populares:
              </label>
              <div className="flex flex-wrap gap-2">
                {POPULAR_CITIES.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => handleSelectCity(c.name, c.state, c.lat, c.lon)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                      selectedWeather.city === c.name
                        ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-xs'
                        : isDark
                        ? 'bg-[#152033] border-slate-700 text-slate-300 hover:border-slate-500'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {c.name} ({c.state})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`pt-3.5 border-t flex items-center justify-between gap-3 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <span className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Última checagem: {new Date(selectedWeather.lastFetchedAt).toLocaleTimeString('pt-BR')}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className={`px-4 py-2 text-xs font-medium rounded-full transition-colors cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-5 py-2 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Aplicar na TV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
