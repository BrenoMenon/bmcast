import test from 'node:test';
import assert from 'node:assert/strict';
import { SUPABASE_SQL_SCHEMA, DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY } from './supabaseClient';

test('SUPABASE_SQL_SCHEMA contains all necessary tables and RLS policies', () => {
  assert.ok(SUPABASE_SQL_SCHEMA.includes('create table if not exists public.screens'));
  assert.ok(SUPABASE_SQL_SCHEMA.includes('create table if not exists public.media'));
  assert.ok(SUPABASE_SQL_SCHEMA.includes('create table if not exists public.playlists'));
  assert.ok(SUPABASE_SQL_SCHEMA.includes('create table if not exists public.system_config'));
  assert.ok(SUPABASE_SQL_SCHEMA.includes('create table if not exists public.ticker_config'));
  assert.ok(SUPABASE_SQL_SCHEMA.includes('create table if not exists public.weather_config'));
  assert.ok(SUPABASE_SQL_SCHEMA.includes('alter table public.screens enable row level security;'));
  assert.ok(SUPABASE_SQL_SCHEMA.includes('alter publication supabase_realtime'));
});

test('Default credentials match user requested Supabase project', () => {
  assert.equal(DEFAULT_SUPABASE_URL, 'https://dkjjgszyrkhdcrwycaej.supabase.co');
  assert.equal(DEFAULT_SUPABASE_KEY, 'sb_publishable_kyAFAx-RJG9MTLjTMmySTw_qoIqy9bD');
});
