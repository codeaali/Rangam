-- ============================================================
-- CineSchool Movie Booking — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. USERS ────────────────────────────────────────────────────
create table if not exists public.users (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null unique,
  phone      text not null,
  created_at timestamptz not null default now()
);

-- 2. MOVIES ───────────────────────────────────────────────────
create table if not exists public.movies (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  poster_url text
);

-- 3. SHOWS ────────────────────────────────────────────────────
create table if not exists public.shows (
  id         uuid primary key default gen_random_uuid(),
  movie_id   uuid not null references public.movies(id) on delete cascade,
  show_time  timestamptz not null,
  seat_limit integer not null check (seat_limit > 0)
);

-- 4. BOOKINGS ─────────────────────────────────────────────────
create table if not exists public.bookings (
  id         uuid primary key default gen_random_uuid(),
  booking_id text not null unique,          -- e.g. SCHMOV-AB12X
  user_id    uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 5. BOOKING ITEMS ────────────────────────────────────────────
create table if not exists public.booking_items (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  show_id    uuid not null references public.shows(id) on delete cascade,
  seats      integer not null check (seats > 0)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users          enable row level security;
alter table public.movies         enable row level security;
alter table public.shows          enable row level security;
alter table public.bookings       enable row level security;
alter table public.booking_items  enable row level security;

-- Allow anonymous reads on movies & shows (public booking page)
create policy "Public can read movies"
  on public.movies for select using (true);

create policy "Public can read shows"
  on public.shows for select using (true);

-- Allow anonymous reads on booking_items (for seat availability calc)
create policy "Public can read booking_items"
  on public.booking_items for select using (true);

-- Allow anyone to create users, bookings, and booking items
create policy "Anyone can insert users"
  on public.users for insert with check (true);

create policy "Anyone can read users by email"
  on public.users for select using (true);

create policy "Anyone can insert bookings"
  on public.bookings for insert with check (true);

create policy "Anyone can read bookings"
  on public.bookings for select using (true);

create policy "Anyone can insert booking_items"
  on public.booking_items for insert with check (true);

-- Admin full access (service-role key bypasses RLS, but explicit for safety)
create policy "Admin full access to movies"
  on public.movies for all using (true) with check (true);

create policy "Admin full access to shows"
  on public.shows for all using (true) with check (true);

-- ============================================================
-- INDEXES (performance)
-- ============================================================

create index if not exists idx_shows_movie_id         on public.shows(movie_id);
create index if not exists idx_bookings_user_id        on public.bookings(user_id);
create index if not exists idx_booking_items_booking   on public.booking_items(booking_id);
create index if not exists idx_booking_items_show       on public.booking_items(show_id);

-- ============================================================
-- SAMPLE DATA (optional — delete if you don't need it)
-- ============================================================

-- Insert two sample movies
insert into public.movies (name) values
  ('Interstellar'),
  ('The Dark Knight')
on conflict (name) do nothing;

-- Insert sample shows (adjust dates as needed)
insert into public.shows (movie_id, show_time, seat_limit)
select id, now() + interval '1 day 14 hours',  80 from public.movies where name = 'Interstellar'
union all
select id, now() + interval '1 day 17 hours',  80 from public.movies where name = 'Interstellar'
union all
select id, now() + interval '2 days 15 hours', 80 from public.movies where name = 'The Dark Knight'
union all
select id, now() + interval '2 days 18 hours', 80 from public.movies where name = 'The Dark Knight';

-- ============================================================
-- STORAGE (for poster images)
-- ============================================================

-- Create a bucket for movie posters
insert into storage.buckets (id, name, public)
values ('posters', 'posters', true)
on conflict (id) do nothing;

-- Allow public read access to posters bucket
create policy "Public can view posters" on storage.objects
  for select using ( bucket_id = 'posters' );

-- Allow public insert access for now (we'll rely on the app's admin login)
create policy "Anyone can upload posters" on storage.objects
  for insert with check ( bucket_id = 'posters' );

-- ============================================================
-- CHECK-INS
-- ============================================================

create table if not exists public.checkins (
  id              uuid primary key default gen_random_uuid(),
  booking_item_id uuid not null references public.booking_items(id) on delete cascade unique,
  created_at      timestamptz not null default now()
);

alter table public.checkins enable row level security;

create policy "Admin full access to checkins"
  on public.checkins for all using (true) with check (true);

create policy "Public can read checkins"
  on public.checkins for select using (true);
