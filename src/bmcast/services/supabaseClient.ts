import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://dkjjgszyrkhdcrwycaej.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'sb_publishable_kyAFAx-RJG9MTLjTMmySTw_qoIqy9bD';

export const SUPABASE_CHANGED_EVENT = 'bmcast_supabase_changed';

const STORAGE_KEYS = {
  URL: 'bmcast_supabase_url',
  KEY: 'bmcast_supabase_key',
  ENABLED: 'bmcast_supabase_enabled',
};

export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- BM CAST: Schema Oficial do Banco de Dados Supabase
-- Copie e cole este script no SQL Editor do seu painel Supabase e clique em Run
-- ==============================================================================

-- 1. Habilitar UUID
create extension if not exists "uuid-ossp";

-- 2. Tabela de Contas e Recuperação de Acesso
create table if not exists public.app_users (
  id text primary key,
  name text not null,
  email text not null unique,
  password_hash text not null,
  recovery_key_hash text not null,
  recovery_question text default '',
  salt text not null,
  created_at timestamptz default now()
);

-- 3. Tabela de Telas e Displays (Smart TVs, Telões, Monitores)
create table if not exists public.screens (
  id text primary key,
  name text not null,
  location text default '',
  slug text not null unique,
  pairing_code text default '',
  active_playlist_id text default '',
  status text default 'online',
  resolution text default '1080p',
  orientation text default 'landscape',
  aspect_ratio text default '16:9',
  layout_mode text default 'clean_media',
  brand_name text,
  brand_slogan text,
  brand_logo text,
  last_ping timestamptz default now(),
  paired_at timestamptz default now(),
  notes text,
  created_at timestamptz default now()
);

-- 4. Tabela de Mídias e Slides
create table if not exists public.media (
  id text primary key,
  title text not null,
  type text default 'image',
  url text not null,
  thumbnail text,
  duration_default integer default 12,
  category text default 'cardapio',
  brand_config jsonb,
  qr_config jsonb,
  category_overlay jsonb,
  file_size text,
  dimensions text,
  created_at timestamptz default now()
);

-- 5. Tabela de Playlists (Grades de Programação)
create table if not exists public.playlists (
  id text primary key,
  name text not null,
  description text default '',
  screen_id text default 'all',
  items jsonb default '[]'::jsonb,
  is_default boolean default false,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- 6. Tabela de Configurações da Empresa e Marca
create table if not exists public.system_config (
  id text primary key default 'default',
  organization_name text default '',
  brand_profile jsonb default '{}'::jsonb,
  theme_accent text default '#2563EB',
  theme_mode text default 'dark',
  default_layout_mode text default 'clean_media',
  enable_split_mode boolean default true,
  updated_at timestamptz default now()
);

-- 7. Tabela do Letreiro Digital (Ticker)
create table if not exists public.ticker_config (
  id text primary key default 'default',
  enabled boolean default true,
  text text not null,
  speed text default 'normal',
  accent_title text default 'AVISO AO VIVO',
  preset_topic text default 'retail',
  updated_at timestamptz default now()
);

-- 8. Tabela de Clima e Previsão do Tempo
create table if not exists public.weather_config (
  id text primary key default 'default',
  auto_detect boolean default false,
  city text default 'São Paulo',
  state_code text default 'SP',
  latitude double precision default -23.5505,
  longitude double precision default -46.6333,
  temp double precision default 24,
  temp_min double precision default 18,
  temp_max double precision default 27,
  condition text default 'partly_cloudy',
  condition_text text default 'Parcialmente Nublado',
  humidity integer default 58,
  wind_km_h double precision default 12,
  last_fetched_at timestamptz default now(),
  source text default 'open_meteo_live'
);

-- 9. Ativação de RLS (Row Level Security)
alter table public.app_users enable row level security;
alter table public.screens enable row level security;
alter table public.media enable row level security;
alter table public.playlists enable row level security;
alter table public.system_config enable row level security;
alter table public.ticker_config enable row level security;
alter table public.weather_config enable row level security;

-- 10. Políticas de Leitura e Escrita Públicas (para os Displays e Painel do BM CAST)
drop policy if exists "BMCAST app_users all" on public.app_users;
create policy "BMCAST app_users all" on public.app_users for all using (true) with check (true);

drop policy if exists "BMCAST screens all" on public.screens;
create policy "BMCAST screens all" on public.screens for all using (true) with check (true);

drop policy if exists "BMCAST media all" on public.media;
create policy "BMCAST media all" on public.media for all using (true) with check (true);

drop policy if exists "BMCAST playlists all" on public.playlists;
create policy "BMCAST playlists all" on public.playlists for all using (true) with check (true);

drop policy if exists "BMCAST system_config all" on public.system_config;
create policy "BMCAST system_config all" on public.system_config for all using (true) with check (true);

drop policy if exists "BMCAST ticker_config all" on public.ticker_config;
create policy "BMCAST ticker_config all" on public.ticker_config for all using (true) with check (true);

drop policy if exists "BMCAST weather_config all" on public.weather_config;
create policy "BMCAST weather_config all" on public.weather_config for all using (true) with check (true);

-- 11. Bucket de Storage para Fotos, Logos e QR Codes
insert into storage.buckets (id, name, public)
values ('bmcast-media', 'bmcast-media', true)
on conflict (id) do nothing;

drop policy if exists "BMCAST storage select" on storage.objects;
create policy "BMCAST storage select" on storage.objects for select using (bucket_id = 'bmcast-media');

drop policy if exists "BMCAST storage insert" on storage.objects;
create policy "BMCAST storage insert" on storage.objects for insert with check (bucket_id = 'bmcast-media');

drop policy if exists "BMCAST storage update" on storage.objects;
create policy "BMCAST storage update" on storage.objects for update using (bucket_id = 'bmcast-media');

drop policy if exists "BMCAST storage delete" on storage.objects;
create policy "BMCAST storage delete" on storage.objects for delete using (bucket_id = 'bmcast-media');

-- 12. Habilitar Publicação Realtime para Atualização Instantânea nas TVs
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

do $$
begin
  begin alter publication supabase_realtime add table public.screens; exception when others then null; end;
  begin alter publication supabase_realtime add table public.media; exception when others then null; end;
  begin alter publication supabase_realtime add table public.playlists; exception when others then null; end;
  begin alter publication supabase_realtime add table public.system_config; exception when others then null; end;
  begin alter publication supabase_realtime add table public.ticker_config; exception when others then null; end;
  begin alter publication supabase_realtime add table public.weather_config; exception when others then null; end;
end $$;
`;

export interface SupabaseTestResult {
  connected: boolean;
  message: string;
  hasTables: boolean;
  missingTables?: string[];
  details?: string;
}

function getEnvVar(name: string): string {
  try {
    const meta = import.meta as unknown as { env?: Record<string, string | undefined> };
    return (meta?.env?.[name] || '').trim();
  } catch {
    return '';
  }
}

class SupabaseService {
  private client: SupabaseClient | null = null;
  private url: string = '';
  private key: string = '';
  private isConfigured: boolean = false;

  constructor() {
    this.initCredentials();
  }

  private initCredentials() {
    if (typeof window === 'undefined') return;

    try {
      // Allow Smart TV links (?sb_url=...&sb_key=...) to bootstrap custom Supabase credentials automatically
      const params = new URLSearchParams(window.location.search);
      const queryUrl = params.get('sb_url')?.trim();
      const queryKey = params.get('sb_key')?.trim();

      if (queryUrl && queryKey) {
        localStorage.setItem(STORAGE_KEYS.URL, queryUrl);
        localStorage.setItem(STORAGE_KEYS.KEY, queryKey);
        localStorage.setItem(STORAGE_KEYS.ENABLED, 'true');
      }

      const storedUrl = localStorage.getItem(STORAGE_KEYS.URL);
      const storedKey = localStorage.getItem(STORAGE_KEYS.KEY);
      const storedEnabled = localStorage.getItem(STORAGE_KEYS.ENABLED);

      const envUrl = getEnvVar('VITE_SUPABASE_URL');
      const envKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

      this.url = (storedUrl ?? (envUrl || DEFAULT_SUPABASE_URL)).trim();
      this.key = (storedKey ?? (envKey || DEFAULT_SUPABASE_KEY)).trim();
      this.isConfigured = storedEnabled === null ? Boolean(this.url && this.key) : storedEnabled === 'true';

      if (this.url && this.key && this.isConfigured) {
        this.client = createClient(this.url, this.key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          },
        });
      }
    } catch (e) {
      console.warn('Erro ao inicializar credenciais do Supabase:', e);
    }
  }

  getClient(): SupabaseClient | null {
    if (!this.isConfigured) return null;
    if (!this.client && this.url && this.key) {
      try {
        this.client = createClient(this.url, this.key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          },
        });
      } catch (err) {
        console.error('Falha ao criar cliente Supabase:', err);
      }
    }
    return this.client;
  }

  getCredentials() {
    return {
      url: this.url,
      key: this.key,
      isConfigured: this.isConfigured && Boolean(this.url && this.key),
      isCustom:
        Boolean(this.url && this.key) &&
        (this.url !== DEFAULT_SUPABASE_URL || this.key !== DEFAULT_SUPABASE_KEY),
    };
  }

  buildScreenShareUrl(slug: string): string {
    const cleanSlug = slug.trim().replace(/^\/+/, '');
    if (typeof window === 'undefined') return `https://bmcast.app/${cleanSlug}`;
    return `${window.location.origin}/${encodeURIComponent(cleanSlug)}`;
  }

  setCredentials(url: string, key: string, enabled = true) {
    this.url = url.trim().replace(/\/$/, '');
    this.key = key.trim();
    this.isConfigured = enabled && Boolean(this.url && this.key);

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.URL, this.url);
      localStorage.setItem(STORAGE_KEYS.KEY, this.key);
      localStorage.setItem(STORAGE_KEYS.ENABLED, String(this.isConfigured));
      localStorage.removeItem(`bmcast_schema_missing_${this.url}`);
    }

    if (this.url && this.key && this.isConfigured) {
      this.client = createClient(this.url, this.key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } else {
      this.client = null;
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SUPABASE_CHANGED_EVENT));
    }
  }

  resetToDefaultCredentials() {
    const envUrl = getEnvVar('VITE_SUPABASE_URL') || DEFAULT_SUPABASE_URL;
    const envKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || DEFAULT_SUPABASE_KEY;
    this.setCredentials(envUrl, envKey, true);
  }

  isSchemaKnownMissing(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const ts = localStorage.getItem(`bmcast_schema_missing_${this.url}`);
      if (!ts) return false;
      if (Date.now() - Number(ts) > 15 * 60 * 1000) {
        localStorage.removeItem(`bmcast_schema_missing_${this.url}`);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  markSchemaStatus(ready: boolean) {
    if (typeof window === 'undefined') return;
    try {
      if (ready) {
        localStorage.removeItem(`bmcast_schema_missing_${this.url}`);
      } else {
        localStorage.setItem(`bmcast_schema_missing_${this.url}`, String(Date.now()));
      }
    } catch {
      /* ignore */
    }
  }

  async uploadAsset(file: File, folder = 'slides'): Promise<string | null> {
    const client = this.getClient();
    if (!client || this.isSchemaKnownMissing()) return null;

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const safeName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await client.storage.from('bmcast-media').upload(safeName, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) return null;
      const { data } = client.storage.from('bmcast-media').getPublicUrl(safeName);
      return data?.publicUrl || null;
    } catch {
      return null;
    }
  }

  async testConnection(testUrl?: string, testKey?: string): Promise<SupabaseTestResult> {
    const url = (testUrl ?? this.url).trim().replace(/\/$/, '');
    const key = (testKey ?? this.key).trim();

    if (!url || !key) {
      return {
        connected: false,
        hasTables: false,
        message: 'Informe a Project URL e a Chave Anon/Publishable do seu projeto Supabase.',
      };
    }

    let apiReachable = false;
    try {
      const authRes = await fetch(`${url}/auth/v1/settings`, {
        method: 'GET',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      });

      if (authRes.ok) {
        apiReachable = true;
      } else if (authRes.status === 401 || authRes.status === 403) {
        const retryRes = await fetch(`${url}/auth/v1/settings`, {
          method: 'GET',
          headers: { apikey: key },
        });
        if (retryRes.ok) {
          apiReachable = true;
        } else {
          return {
            connected: false,
            hasTables: false,
            message: `Chave do Supabase inválida ou não autorizada (HTTP ${retryRes.status}).`,
          };
        }
      }
    } catch (e: any) {
      return {
        connected: false,
        hasTables: false,
        message: `Não foi possível alcançar "${url}". Confira a URL do seu projeto Supabase.`,
        details: e?.message,
      };
    }

    try {
      const tempClient = createClient(url, key);
      const tablesToCheck = ['screens', 'media', 'playlists', 'system_config', 'ticker_config', 'weather_config'];
      const missing: string[] = [];

      const firstCheck = await tempClient.from('screens').select('id').limit(1);
      if (
        firstCheck.error &&
        (firstCheck.error.code === 'PGRST205' ||
          firstCheck.error.code === '42P01' ||
          firstCheck.error.message.includes('Could not find the table') ||
          firstCheck.error.message.includes('does not exist'))
      ) {
        this.markSchemaStatus(false);
        return {
          connected: true,
          hasTables: false,
          missingTables: tablesToCheck,
          message: 'Conectado à API do Supabase! Falta apenas executar o Script SQL abaixo para criar as tabelas.',
          details: 'Copie o Script SQL abaixo, cole no SQL Editor do seu Supabase e clique em Run.',
        };
      }

      for (const table of tablesToCheck.slice(1)) {
        const { error } = await tempClient.from(table).select('id').limit(1);
        if (
          error &&
          (error.code === 'PGRST205' ||
            error.code === '42P01' ||
            error.message.includes('Could not find the table') ||
            error.message.includes('does not exist'))
        ) {
          missing.push(table);
        }
      }

      if (missing.length === 0) {
        this.markSchemaStatus(true);
        return {
          connected: true,
          hasTables: true,
          message: 'Conexão estabelecida com sucesso! Todas as tabelas estão prontas e sincronizadas.',
        };
      } else {
        this.markSchemaStatus(false);
        return {
          connected: true,
          hasTables: false,
          missingTables: missing,
          message: 'Conectado ao Supabase! Algumas tabelas ainda precisam ser criadas no SQL Editor.',
          details: `Tabelas pendentes: ${missing.join(', ')}`,
        };
      }
    } catch (e: any) {
      return {
        connected: apiReachable,
        hasTables: false,
        message: apiReachable
          ? 'Conectado à API do Supabase, mas as tabelas ainda não foram inicializadas.'
          : 'Erro ao verificar tabelas do Supabase.',
        details: e?.message,
      };
    }
  }
}

export const supabaseService = new SupabaseService();
