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
  WeatherCityResult,
} from '../../services/weatherService';

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeather: WeatherConfig;
  onSaveWeather: (updated: WeatherConfig) => void;
}

const POPULAR_CITIES = [
  { name: 'São Paulo', state: 'SP', lat: -23.5505, lon: -46.6333 },
  { name: 'Rio de Janeiro', state: 'RJ', lat: -22.9068, lon: -43.1729 },
  { name: 'Curitiba', state: 'PR', lat: -25.4284, lon: -49.2733 },
  { name: 'Belo Horizonte', state: 'MG', lat: -19.9167, lon: -43.9345 },
  { name: 'Florianópolis', state: 'SC', lat: -27.5954, lon: -48.548 },
  { name: 'Porto Alegre', state: 'RS', lat: -30.0346, lon: -51.2177 },
  { name: 'Brasília', state: 'DF', lat: -15.7975, lon: -47.8919 },
  { name: 'Salvador', state: 'BA', lat: -12.9777, lon: -38.5016 },
  { name: 'Campinas', state: 'SP', lat: -22.9056, lon: -47.0608 },
  { name: 'Goiânia', state: 'GO', lat: -16.6869, lon: -49.2648 },
];

export const WeatherModal: React.FC<WeatherModalProps> = ({
  isOpen,
  onClose,
  currentWeather,
  onSaveWeather,
}) => {
  const [selectedWeather, setSelectedWeather] = useState<WeatherConfig>(currentWeather);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WeatherCityResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedWeather(currentWeather);
      setSearchQuery('');
      setSearchResults([]);
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
        const results = await weatherService.searchCity(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error('Erro ao buscar cidades:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

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
    try {
      const freshData = await weatherService.fetchRealWeather(lat, lon, name, stateCode);
      setSelectedWeather(freshData);
    } catch (err) {
      console.error('Erro ao buscar clima da cidade:', err);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) return;
    setIsLoadingWeather(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const freshData = await weatherService.fetchRealWeather(
            pos.coords.latitude,
            pos.coords.longitude,
            'Localização Atual',
            ''
          );
          setSelectedWeather(freshData);
        } catch (err) {
          console.error('Erro clima GPS:', err);
        } finally {
          setIsLoadingWeather(false);
        }
      },
      (err) => {
        console.warn('GPS negado ou indisponível:', err);
        setIsLoadingWeather(false);
      }
    );
  };

  const handleRefreshCurrent = async () => {
    setIsLoadingWeather(true);
    try {
      const fresh = await weatherService.fetchRealWeather(
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
    onSaveWeather(selectedWeather);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#151f32] border border-[#25334a] rounded-3xl shadow-2xl p-4 sm:p-6 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#25334a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0d131f] text-[#2dd4bf] border border-[#25334a] flex items-center justify-center shrink-0">
              <CloudSun className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2 tracking-tight">
                Previsão do Tempo Oficial
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#0d131f] text-[#2dd4bf] border border-[#25334a]">
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
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-[#1e293b] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Live Weather Preview Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0d131f] border border-[#25334a] shadow-sm relative overflow-hidden">
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                onClick={handleRefreshCurrent}
                disabled={isLoadingWeather}
                className="px-3 py-1.5 rounded-full bg-[#1e293b] hover:bg-[#27364d] text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-[#2d3d57]"
                title="Atualizar agora via API"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWeather ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-[#2dd4bf] font-bold text-sm">
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

              <div className="grid grid-cols-2 gap-3 bg-[#151f32] p-3 rounded-2xl border border-[#25334a] text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Droplets className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Umidade</div>
                    <div className="font-bold text-white">{selectedWeather.humidity}%</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Wind className="w-4 h-4 text-[#2dd4bf] shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Vento</div>
                    <div className="font-bold text-white">{selectedWeather.windKmH} km/h</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search City Input */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Digite o nome de qualquer cidade (ex: Curitiba, Campinas, Santos)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0d131f] border border-[#25334a] rounded-full text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2dd4bf] transition-colors"
                />
                {isSearching && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    <RefreshCw className="w-4 h-4 text-[#2dd4bf] animate-spin" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleDetectGPS}
                className="px-4 py-2.5 bg-[#1e293b] hover:bg-[#27364d] border border-[#2d3d57] rounded-full text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Compass className="w-4 h-4 text-sky-400" />
                <span>GPS</span>
              </button>
            </div>

            {/* Search Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto bg-[#0d131f] border border-[#25334a] rounded-2xl divide-y divide-[#25334a] shadow-xl">
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
                    className="p-3 hover:bg-[#151f32] cursor-pointer flex items-center justify-between text-xs text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#2dd4bf] shrink-0" />
                      <span className="font-semibold text-white">{city.name}</span>
                      <span className="text-slate-400">
                        {city.admin1 ? `(${city.admin1})` : ''} - {city.country}
                      </span>
                    </div>
                    <span className="text-[#2dd4bf] font-semibold text-[11px]">Selecionar</span>
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
                        ? 'bg-[#2dd4bf] text-[#042f2e] border-[#2dd4bf] font-bold shadow-sm'
                        : 'bg-[#1e293b] border-[#2d3d57] text-slate-300 hover:text-white hover:border-[#384b6c]'
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
        <div className="pt-3.5 border-t border-[#25334a] flex items-center justify-between gap-3">
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
              className="flex items-center gap-1.5 px-5 py-2 bg-[#2dd4bf] hover:bg-[#20b8a4] active:scale-95 text-[#042f2e] text-xs font-bold rounded-full transition-all cursor-pointer shadow-sm"
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
