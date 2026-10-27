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
  onSave?: ((updated: WeatherConfig) => void) | undefined;
  onSaveWeather?: ((updated: WeatherConfig) => void) | undefined;
  setupHint?: string | undefined;
}

export const WeatherModal: React.FC<WeatherModalProps> = ({
  isOpen,
  onClose,
  currentWeather,
  onSave,
  onSaveWeather,
  setupHint,
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
        setGpsStatusMsg('Permissão de GPS não concedida. Busque a cidade pelo nome.');
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
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl sm:rounded-[2rem] border border-border bg-card p-4 sm:p-6 text-card-foreground shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
              <CloudSun className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold tracking-tight text-foreground truncate">
                Previsão do Tempo ao Vivo
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                Exibe temperatura e condição climática atualizada na TV
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-4">
          {setupHint && (
            <p className="rounded-2xl border border-primary/25 bg-primary/10 px-3.5 py-2.5 text-xs font-semibold text-primary">
              {setupHint}
            </p>
          )}

          {/* Live Weather Preview Card (Non-overlapping flex header for mobile) */}
          <div className="rounded-3xl border border-border bg-muted/40 p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary min-w-0">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {selectedWeather.city}
                  {selectedWeather.stateCode ? `, ${selectedWeather.stateCode}` : ''}
                </span>
              </div>

              <button
                type="button"
                onClick={handleRefreshCurrent}
                disabled={isLoadingWeather}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer shrink-0"
                title="Atualizar agora"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 text-primary ${isLoadingWeather ? 'animate-spin' : ''}`}
                />
                <span>Atualizar</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground tabular-nums">
                    {selectedWeather.temp}°C
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-muted-foreground">
                    {selectedWeather.conditionText}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
                  <span>Mín: {selectedWeather.tempMin}°C</span>
                  <span aria-hidden="true">·</span>
                  <span>Máx: {selectedWeather.tempMax}°C</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-3.5 text-xs">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <div className="text-[10px] font-medium text-muted-foreground">Umidade</div>
                    <div className="font-bold text-foreground tabular-nums">
                      {selectedWeather.humidity}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <div className="text-[10px] font-medium text-muted-foreground">Vento</div>
                    <div className="font-bold text-foreground tabular-nums">
                      {selectedWeather.windKmH} km/h
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {gpsStatusMsg && (
            <div className="flex items-center gap-2 rounded-2xl border border-primary/25 bg-primary/10 p-3 text-xs text-foreground">
              <Compass className="h-4 w-4 text-primary shrink-0" />
              <span>{gpsStatusMsg}</span>
            </div>
          )}

          {/* Search City Input & GPS button (Responsive stack on mobile) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Digite o nome da sua cidade..."
                  className="w-full rounded-2xl border border-border bg-muted/40 pl-10 pr-9 py-2.5 text-base sm:text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none transition"
                />
                {isSearching && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    <RefreshCw className="h-4 w-4 text-primary animate-spin" />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={isLoadingWeather}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-95 transition cursor-pointer shrink-0 disabled:opacity-50"
              >
                <Compass className="h-4 w-4 shrink-0" />
                <span>Usar Meu GPS</span>
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-2xl border border-border bg-card divide-y divide-border shadow-lg">
                {searchResults.map((city) => (
                  <button
                    key={`${city.id}-${city.name}`}
                    type="button"
                    onClick={() =>
                      handleSelectCity(
                        city.name,
                        city.admin1 || city.country_code,
                        city.latitude,
                        city.longitude
                      )
                    }
                    className="flex w-full items-center justify-between gap-2 p-3 text-left text-xs hover:bg-muted transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-semibold text-foreground truncate">{city.name}</span>
                      <span className="text-muted-foreground truncate">
                        {city.admin1 ? `(${city.admin1})` : ''} · {city.country}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-primary shrink-0">Selecionar</span>
                  </button>
                ))}
              </div>
            )}

            <div>
              <label className="mb-2 block text-xs font-semibold text-muted-foreground">
                Atalhos de Capitais:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_CITIES.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => handleSelectCity(c.name, c.state, c.lat, c.lon)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                      selectedWeather.city === c.name
                        ? 'border-primary bg-primary text-primary-foreground font-bold shadow-xs'
                        : 'border-border bg-muted/45 text-foreground hover:bg-muted'
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border pt-3.5">
          <span className="text-[11px] text-muted-foreground truncate">
            Atualizado às {new Date(selectedWeather.lastFetchedAt).toLocaleTimeString('pt-BR')}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-95 active:scale-[0.98] transition cursor-pointer"
            >
              <Check className="h-4 w-4 shrink-0" />
              <span>Aplicar na TV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
