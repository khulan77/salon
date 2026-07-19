-- Lumière salon — Postgres schema for Supabase.
-- Run this once in Supabase → SQL Editor → New query → Run.
--
-- All app data access goes through the SECRET (service-role) key on the server,
-- which bypasses RLS. We enable RLS with NO policies so the public/publishable
-- key (used only for Auth) cannot read or write these tables directly.

create table if not exists public.services (
  id           text primary key,
  name         text not null,
  description  text not null default '',
  category     text not null default 'Бусад',
  duration_min integer not null default 60,
  price        integer not null default 0,
  sale_percent integer not null default 0,
  emoji        text not null default '✨',
  active       boolean not null default true,
  constraint services_sale_percent_range check (sale_percent between 0 and 90)
);

-- Migration for databases created before the sale feature existed.
alter table public.services
  add column if not exists sale_percent integer not null default 0;

create table if not exists public.staff (
  id          text primary key,
  name        text not null,
  title       text not null default '',
  bio         text not null default '',
  service_ids text[] not null default '{}',
  emoji       text not null default '💇‍♀️',
  image_url   text,
  email       text,
  active      boolean not null default true
);

create table if not exists public.bookings (
  id             text primary key,
  service_id     text not null,
  staff_id       text not null,
  date           text not null,
  time           text not null,
  customer_name  text not null,
  customer_phone text not null,
  note           text not null default '',
  status         text not null default 'pending',
  code           text,
  created_at     timestamptz not null default now()
);
create index if not exists bookings_staff_date_idx on public.bookings (staff_id, date);

-- Захиалгын код (үйлчлүүлэгч /my хуудаснаас захиалгаа хайхад хэрэглэнэ).
alter table public.bookings add column if not exists code text;
create unique index if not exists bookings_code_key on public.bookings (code);

create table if not exists public.reviews (
  id            text primary key,
  customer_name text not null,
  rating        integer not null default 5,
  text          text not null default '',
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists public.settings (
  id           integer primary key default 1,
  open_time    text not null default '10:00',
  close_time   text not null default '20:00',
  slot_minutes integer not null default 30,
  closed_days  integer[] not null default '{}',
  constraint settings_singleton check (id = 1)
);

-- Lock down: enable RLS, add no policies (service-role key still bypasses it).
alter table public.services enable row level security;
alter table public.staff    enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews  enable row level security;
alter table public.settings enable row level security;
