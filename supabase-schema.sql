-- ==============================================================================
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
