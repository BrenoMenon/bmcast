import { WeatherConfig } from '../types/signage';

export interface CitySearchResult {
  id: number;
  name: string;
  admin1?: string; // State / Region
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
}

export const POPULAR_CITIES = [
  { name: 'São Paulo', state: 'SP', lat: -23.5505, lon: -46.6333 },
  { name: 'Rio de Janeiro', state: 'RJ', lat: -22.9068, lon: -43.1729 },
  { name: 'Belo Horizonte', state: 'MG', lat: -19.9167, lon: -43.9345 },
  { name: 'Curitiba', state: 'PR', lat: -25.4284, lon: -49.2733 },
  { name: 'Porto Alegre', state: 'RS', lat: -30.0346, lon: -51.2177 },
  { name: 'Brasília', state: 'DF', lat: -15.7975, lon: -47.8919 },
  { name: 'Salvador', state: 'BA', lat: -12.9714, lon: -38.5014 },
  { name: 'Fortaleza', state: 'CE', lat: -3.7319, lon: -38.5267 },
  { name: 'Goiânia', state: 'GO', lat: -16.6869, lon: -49.2648 },
  { name: 'Campinas', state: 'SP', lat: -22.9056, lon: -47.0608 },
  { name: 'Santos', state: 'SP', lat: -23.9608, lon: -46.3336 },
  { name: 'Florianópolis', state: 'SC', lat: -27.5954, lon: -48.548 },
  { name: 'Manaus', state: 'AM', lat: -3.119, lon: -60.0217 },
  { name: 'Recife', state: 'PE', lat: -8.0476, lon: -34.877 },
  { name: 'Vitória', state: 'ES', lat: -20.3155, lon: -40.3128 },
  { name: 'Cuiabá', state: 'MT', lat: -15.6014, lon: -56.0979 },
  { name: 'Belém', state: 'PA', lat: -1.4558, lon: -48.4902 },
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function mapWmoCodeToCondition(code: number): {
  condition: WeatherConfig['condition'];
  text: string;
} {
  if (code === 0) return { condition: 'sunny', text: 'Céu Limpo' };
  if (code === 1) return { condition: 'sunny', text: 'Ensolarado' };
  if (code === 2) return { condition: 'partly_cloudy', text: 'Parcialmente Nublado' };
  if (code === 3) return { condition: 'cloudy', text: 'Nublado' };
  if (code >= 45 && code <= 48) return { condition: 'cloudy', text: 'Nevoeiro' };
  if (code >= 51 && code <= 55) return { condition: 'rainy', text: 'Garoa' };
  if (code >= 61 && code <= 65) return { condition: 'rainy', text: 'Chuva Moderada' };
  if (code >= 80 && code <= 82) return { condition: 'rainy', text: 'Pancadas de Chuva' };
  if (code >= 95 && code <= 99) return { condition: 'storm', text: 'Tempestade com Trovoadas' };
  return { condition: 'partly_cloudy', text: 'Tempo Agradável' };
}

export const weatherService = {
  /**
   * Busca cidades na API de Geocoding do Open-Meteo
   */
  async searchCities(query: string): Promise<CitySearchResult[]> {
    if (!query || query.trim().length < 2) return [];
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        query.trim()
      )}&count=8&language=pt&format=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Falha na busca de cidades');
      const data = await res.json();
      return (data.results || []) as CitySearchResult[];
    } catch (err) {
      console.warn('Fallback busca de cidades:', err);
      const q = query.toLowerCase();
      return POPULAR_CITIES.filter(
        (c) => c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q)
      ).map((c, idx) => ({
        id: idx + 1000,
        name: c.name,
        admin1: c.state,
        country: 'Brasil',
        country_code: 'BR',
        latitude: c.lat,
        longitude: c.lon,
      }));
    }
  },

  // Alias for backward compatibility
  async searchCity(query: string): Promise<CitySearchResult[]> {
    return this.searchCities(query);
  },

  /**
   * Identifica nome da cidade a partir de coordenadas GPS
   */
  async reverseGeocode(lat: number, lon: number): Promise<{ city: string; state: string }> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { 'Accept-Language': 'pt-BR,pt;q=0.9', 'User-Agent': 'BMCastPro-Signage/1.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        const address = data.address || {};
        const cityName =
          address.city ||
          address.town ||
          address.municipality ||
          address.village ||
          address.suburb ||
          '';
        const stateName = address.state || address.region || '';
        if (cityName) {
          return { city: cityName, state: stateName };
        }
      }
    } catch (err) {
      console.warn('Nominatim reverse geocode indisponível, usando cálculo de aproximação:', err);
    }

    // Fallback: acha cidade brasileira mais próxima
    let nearest = POPULAR_CITIES[0];
    let minDistance = Infinity;
    for (const c of POPULAR_CITIES) {
      const dist = calculateDistance(lat, lon, c.lat, c.lon);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = c;
      }
    }
    return { city: nearest.name, state: nearest.state };
  },

  /**
   * Consulta a API de previsão em tempo real do Open-Meteo
   */
  async fetchLiveWeather(
    lat: number,
    lon: number,
    cityName = 'São Paulo',
    stateCode = 'SP'
  ): Promise<WeatherConfig> {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const data = await res.json();
      const current = data.current || {};
      const daily = data.daily || {};

      const currentTemp = Math.round(current.temperature_2m ?? 24);
      const humidity = Math.round(current.relative_humidity_2m ?? 60);
      const wind = Math.round(current.wind_speed_10m ?? 10);
      const code = current.weather_code ?? 1;

      const tempMax =
        daily.temperature_2m_max && daily.temperature_2m_max.length > 0
          ? Math.round(daily.temperature_2m_max[0])
          : currentTemp + 3;
      const tempMin =
        daily.temperature_2m_min && daily.temperature_2m_min.length > 0
          ? Math.round(daily.temperature_2m_min[0])
          : currentTemp - 4;

      const { condition, text } = mapWmoCodeToCondition(code);

      return {
        autoDetect: false,
        city: cityName,
        stateCode: stateCode,
        latitude: lat,
        longitude: lon,
        temp: currentTemp,
        tempMin,
        tempMax,
        condition,
        conditionText: text,
        humidity,
        windKmH: wind,
        lastFetchedAt: new Date().toISOString(),
        source: 'open_meteo_live',
      };
    } catch (err: any) {
      console.warn('Falha ao obter clima da API Open-Meteo, usando dados de segurança:', err);
      return {
        autoDetect: false,
        city: cityName,
        stateCode: stateCode,
        latitude: lat,
        longitude: lon,
        temp: 24,
        tempMin: 19,
        tempMax: 27,
        condition: 'partly_cloudy',
        conditionText: 'Tempo Bom',
        humidity: 62,
        windKmH: 14,
        lastFetchedAt: new Date().toISOString(),
        source: 'cached',
        error: err?.message || 'Estação temporariamente instável',
      };
    }
  },

  // Alias for backward compatibility
  async fetchRealWeather(
    lat: number,
    lon: number,
    cityName?: string,
    stateCode?: string
  ): Promise<WeatherConfig> {
    return this.fetchLiveWeather(lat, lon, cityName, stateCode);
  },

  /**
   * Tenta detectar localização via GPS do navegador
   */
  async detectBrowserLocation(): Promise<{ lat: number; lon: number } | null> {
    if (typeof window === 'undefined' || !navigator.geolocation) return null;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        },
        () => resolve(null),
        { timeout: 7000, enableHighAccuracy: true }
      );
    });
  },
};
