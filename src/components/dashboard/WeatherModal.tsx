import React, { useState, useEffect } from 'react';
import {
  X,
  CloudSun,
  Search,
  MapPin,
  Compass,
  Check,
  RefreshCw,
  Wind,
  Droplets,
} from 'lucide-react';
import { WeatherConfig } from '../../types/signage';
import {
  weatherService,
  CitySearchResult,
  POPULAR_CITIES,
} from '../../services/weatherService';

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeather: WeatherConfig;
  onSave?: (updated: WeatherConfig) => void;
  onSaveWeather?: (updated: WeatherConfig) => void;
}

export const WeatherModal: React.FC<WeatherModalProps> = ({
  isOpen,
  onClose,
  currentWeather,
  onSave,
  onSaveWeather,
}) => {
  const [selectedWeather, setSelectedWeather] = useState<WeatherConfig>(currentWeather);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CitySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedWeather(currentWeather);
      setSearchQuery('');
      setSearchResults([]);
      setGpsStatusMsg(null);
    }
  }, [isOpen, currentWeather]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await weatherService.searchCities(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error('Erro ao buscar cidades:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectCity = async (
    name: string,
    stateCode: string,
    lat: number,
    lon: number
  ) => {
    setIsLoadingWeather(true);
    setSearchResults([]);
    setSearchQuery('');
    setGpsStatusMsg(null);
    try {
      const freshData = await weatherService.fetchLiveWeather(lat, lon, name, stateCode);
      setSelectedWeather(freshData);
    } catch (err) {
      console.error('Erro ao buscar clima da cidade:', err);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const handleDetectGPS = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsStatusMsg('Geolocalização não é suportada pelo seu navegador.');
      return;
    }

    setIsLoadingWeather(true);
    setGpsStatusMsg('Detectando sua localização via GPS...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const { city, state } = await weatherService.reverseGeocode(lat, lon);
          const freshData = await weatherService.fetchLiveWeather(
            lat,
            lon,
            city || 'Minha Localização',
            state || ''
          );
          setSelectedWeather(freshData);
          setGpsStatusMsg(`Localizado com sucesso: ${city || 'Coordenadas locais'}`);
        } catch (err) {
          console.error('Erro clima GPS:', err);
          setGpsStatusMsg('Erro ao obter dados do clima para as coordenadas.');
        } finally {
          setIsLoadingWeather(false);
        }
      },
      (err) => {
        console.warn('GPS negado ou indisponível:', err);
        setIsLoadingWeather(false);
        setGpsStatusMsg('Permissão de GPS não concedida. Selecione uma cidade na lista.');
      },
      { timeout: 9000, enableHighAccuracy: true }
    );
  };

  const handleRefreshCurrent = async () => {
    setIsLoadingWeather(true);
    setGpsStatusMsg(null);
    try {
      const fresh = await weatherService.fetchLiveWeather(
        selectedWeather.latitude,
        selectedWeather.longitude,
        selectedWeather.city,
        selectedWeather.stateCode
      );
      setSelectedWeather(fresh);
    } catch (err) {
      console.error('Erro ao atualizar clima:', err);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const handleConfirm = () => {
    (onSave || onSaveWeather)?.(selectedWeather);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-4 sm:p-6 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/40 flex items-center justify-center shrink-0">
              <CloudSun className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2 tracking-tight">
                Previsão do Tempo Oficial
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  Open-Meteo API
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Dados meteorológicos em tempo real com atualização automática na TV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Live Weather Preview Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-700 shadow-sm relative overflow-hidden">
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                onClick={handleRefreshCurrent}
                disabled={isLoadingWeather}
                className="px-3.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                title="Atualizar agora via API"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isLoadingWeather ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-blue-400 font-bold text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {selectedWeather.city}
                    {selectedWeather.stateCode ? `, ${selectedWeather.stateCode}` : ''}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                    {selectedWeather.temp}°C
                  </span>
                  <span className="text-sm font-semibold text-slate-300">
                    {selectedWeather.conditionText}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                  <span>Mín: {selectedWeather.tempMin}°C</span>
                  <span className="text-slate-600">•</span>
                  <span>Máx: {selectedWeather.tempMax}°C</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-900 p-3.5 rounded-2xl border border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Droplets className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Umidade</div>
                    <div className="font-bold text-white">{selectedWeather.humidity}%</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Wind className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Vento</div>
                    <div className="font-bold text-white">{selectedWeather.windKmH} km/h</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GPS Feedback notification if active */}
          {gpsStatusMsg && (
            <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-400 shrink-0 animate-pulse" />
              <span>{gpsStatusMsg}</span>
            </div>
          )}

          {/* Search City Input & GPS button */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Digite o nome de qualquer cidade (ex: Curitiba, Campinas, Santos)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-full text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                {isSearching && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={isLoadingWeather}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-sm disabled:opacity-50"
              >
                <Compass className="w-4 h-4" />
                <span>Usar GPS</span>
              </button>
            </div>

            {/* Search Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto bg-slate-950 border border-slate-700 rounded-2xl divide-y divide-slate-800 shadow-xl">
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
                    className="p-3 hover:bg-slate-900 cursor-pointer flex items-center justify-between text-xs text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="font-semibold text-white">{city.name}</span>
                      <span className="text-slate-400">
                        {city.admin1 ? `(${city.admin1})` : ''} - {city.country}
                      </span>
                    </div>
                    <span className="text-blue-400 font-semibold text-[11px]">Selecionar</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Popular Cities */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">
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
                        ? 'bg-blue-600 text-white border-blue-500 font-bold shadow-sm'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-blue-500/50'
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
        <div className="pt-3.5 border-t border-slate-800 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400 truncate">
            Última checagem: {new Date(selectedWeather.lastFetchedAt).toLocaleTimeString('pt-BR')}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-md"
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
