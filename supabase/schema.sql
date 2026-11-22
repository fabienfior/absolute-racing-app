-- Absolute Racing Team app: database tables and who can see what.
-- Run once in the Supabase SQL Editor (then run seed.sql for the 2027 calendar).
--
-- Roles: crew (everything, edits content, sends alerts), driver (team content aimed at
-- them or their car), sponsor (public news, calendar, results). Visitors who are not signed
-- in see the same public content as sponsors.

create type public.user_role as enum ('crew', 'driver', 'sponsor');

create table public.championships (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  short_name text not null
);

create table public.cars (
  id text primary key default gen_random_uuid()::text,
  number text not null, -- e.g. '#1', matched against series results
  model text not null,
  championship_id text references public.championships on delete set null
);

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null default '',
  role public.user_role not null default 'sponsor',
  job_title text not null default '',
  car_id text references public.cars on delete set null,
  phone text, -- shown to crew only in the app
  created_at timestamptz not null default now()
);

-- People crew has added before they sign in for the first time: their role is set on sign-up.
create table public.invites (
  email text primary key check (email = lower(email)),
  full_name text not null default '',
  role public.user_role not null default 'driver',
  job_title text not null default '',
  car_id text references public.cars on delete set null,
  created_at timestamptz not null default now()
);

create or replace function public.my_role() returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_team() returns boolean
language sql stable as $$ select coalesce(public.my_role() in ('crew', 'driver'), false) $$;

create or replace function public.is_crew() returns boolean
language sql stable as $$ select coalesce(public.my_role() = 'crew', false) $$;

create or replace function public.my_car() returns text
language sql stable security definer set search_path = public as $$
  select car_id from public.profiles where id = auth.uid()
$$;

-- On sign-up: the very first person becomes crew (that is you, Fabien). Everyone else gets the
-- role crew set for their email in `invites`, or sponsor if they were not invited.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  inv public.invites;
  first_user boolean;
begin
  select * into inv from public.invites where email = lower(new.email);
  select not exists (select 1 from public.profiles where role = 'crew') into first_user;
  insert into public.profiles (id, full_name, role, job_title, car_id)
  values (
    new.id,
    coalesce(nullif(inv.full_name, ''), new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when first_user then 'crew' else coalesce(inv.role, 'sponsor') end,
    coalesce(inv.job_title, ''),
    inv.car_id
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.events (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  championship_id text references public.championships on delete set null,
  latitude double precision,
  longitude double precision,
  circuit text not null default '',
  location text not null default '',
  start_date date not null,
  end_date date not null,
  summary text not null default '',
  series_url text, -- the event's page on the series website, filled by sync-series
  created_at timestamptz not null default now()
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  title text not null,
  car_id text references public.cars on delete cascade, -- empty = whole team
  from_series boolean not null default false -- true = official timetable, replaced on each sync
);

create table public.crew_assignments (
  event_id text not null references public.events on delete cascade,
  member_id uuid not null references public.profiles on delete cascade,
  car_id text references public.cars on delete set null,
  duty text not null default '',
  primary key (event_id, member_id)
);

create type public.travel_kind as enum ('flight', 'train', 'rental', 'shuttle', 'hotel', 'restaurant', 'other');
create type public.travel_direction as enum ('outbound', 'onsite', 'return');

create table public.travel_items (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events on delete cascade,
  kind public.travel_kind not null,
  direction public.travel_direction not null default 'outbound',
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  from_place text,
  to_place text,
  reference text,
  address text,
  phone text,
  notes text
);

-- Who is on each booking. No rows = everyone at the event.
create table public.travel_members (
  travel_id uuid not null references public.travel_items on delete cascade,
  member_id uuid not null references public.profiles on delete cascade,
  primary key (travel_id, member_id)
);

create type public.link_kind as enum ('results', 'livetiming', 'stream', 'video', 'onboard', 'other');

create table public.event_links (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events on delete cascade,
  kind public.link_kind not null,
  label text not null,
  url text not null,
  position int not null default 0
);

create type public.audience as enum ('everyone', 'team');

create table public.news_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  event_id text references public.events on delete set null,
  audience public.audience not null default 'everyone',
  published_at timestamptz not null default now()
);

-- Our finishing positions, entered by crew or copied by sync-series.
create table public.team_results (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events on delete cascade,
  session text not null,
  car_id text not null references public.cars on delete cascade,
  position int not null,
  class_position int,
  class_name text,
  from_series boolean not null default false,
  unique (event_id, session, car_id)
);

create table public.standings (
  id uuid primary key default gen_random_uuid(),
  championship_id text not null references public.championships on delete cascade,
  title text not null,
  updated_at timestamptz not null default now(),
  rows jsonb not null default '[]' -- [{position, name, points, ours}]
);

-- Targeting: who a document or alert is for.
create type public.target_type as enum ('all', 'role', 'car');

create or replace function public.is_targeted(t public.target_type, r public.user_role, c text) returns boolean
language sql stable as $$
  select public.is_crew()
      or (public.is_team() and (t = 'all' or (t = 'role' and r = public.my_role()) or (t = 'car' and c = public.my_car())))
$$;

create type public.doc_category as enum ('briefing', 'runplan', 'timetable', 'bulletin', 'media', 'other');

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category public.doc_category not null default 'other',
  event_id text references public.events on delete set null,
  url text, -- a link (shared drive, series website)…
  storage_path text, -- …or a file in the 'documents' storage bucket
  target_type public.target_type not null default 'all',
  target_role public.user_role,
  target_car text references public.cars on delete cascade,
  published_at timestamptz not null default now(),
  check (url is not null or storage_path is not null)
);

create table public.document_reads (
  document_id uuid not null references public.documents on delete cascade,
  member_id uuid not null references public.profiles on delete cascade default auth.uid(),
  read_at timestamptz not null default now(),
  primary key (document_id, member_id)
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  sent_by uuid references public.profiles default auth.uid(), -- empty = sent automatically (series sync)
  sent_at timestamptz not null default now(),
  target_type public.target_type not null default 'all',
  target_role public.user_role,
  target_car text references public.cars on delete cascade,
  document_id uuid references public.documents on delete set null
);

create table public.alert_reads (
  alert_id uuid not null references public.alerts on delete cascade,
  member_id uuid not null references public.profiles on delete cascade default auth.uid(),
  read_at timestamptz not null default now(),
  primary key (alert_id, member_id)
);

-- Expo push tokens, one per device, for push notifications.
create table public.push_tokens (
  token text primary key,
  member_id uuid not null references public.profiles on delete cascade default auth.uid(),
  updated_at timestamptz not null default now()
);

create table public.guide_sections (
  id uuid primary key default gen_random_uuid(),
  position int not null default 0,
  title text not null,
  body text not null default ''
);

create table public.channels (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  roles public.user_role[] not null default '{crew,driver}',
  position int not null default 0
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id text references public.channels on delete cascade, -- group chat
  recipient_id uuid references public.profiles on delete cascade, -- or private chat
  author_id uuid not null references public.profiles default auth.uid(),
  body text not null,
  sent_at timestamptz not null default now(),
  check ((channel_id is null) <> (recipient_id is null))
);

-- Official series pages the app reads (see supabase/functions/sync-series).
-- adapter 'sro': GT World Challenge Asia, Japan Cup, IGTC sites (timetable, noticeboard, results).
-- adapter 'pcca': Carrera Cup Asia media centre (regulations, bulletins, notice board per event).
-- adapter 'links': any page; new PDF links on it are listed as updates.
create table public.series_sources (
  id uuid primary key default gen_random_uuid(),
  championship_id text not null references public.championships on delete cascade,
  adapter text not null check (adapter in ('sro', 'pcca', 'links')),
  kind text not null default 'news' check (kind in ('calendar', 'results', 'bulletins', 'news')),
  label text not null,
  url text not null,
  team_name text not null default 'Absolute Racing', -- how the series writes our team name
  login_secret text, -- e.g. 'SRO_ASIA': the function reads SRO_ASIA_USERNAME / SRO_ASIA_PASSWORD secrets for the teams area
  last_synced_at timestamptz,
  last_error text
);

create table public.series_updates (
  id uuid primary key default gen_random_uuid(),
  championship_id text not null references public.championships on delete cascade,
  event_id text references public.events on delete set null,
  kind text not null,
  section text not null default '', -- e.g. "Event Bulletin"
  title text not null,
  url text not null unique,
  team_only boolean not null default false, -- from the teams area: never shown to sponsors
  found_at timestamptz not null default now()
);

-- Onboard footage: one folder per event and car, kept in a shared drive.
create table public.onboard_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_id text references public.events on delete set null,
  car_id text references public.cars on delete set null,
  drive_url text not null check (drive_url ~ '^https://'),
  created_by uuid references public.profiles default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.onboard_videos (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid not null references public.onboard_folders on delete cascade,
  label text not null,
  url text not null check (url ~ '^https://')
);

-- Row-level security: every table is locked, then opened per role below. ------------
do $$
declare t text;
begin
  foreach t in array array[
    'championships', 'cars', 'profiles', 'invites', 'events', 'sessions', 'crew_assignments',
    'travel_items', 'travel_members', 'event_links', 'news_posts', 'team_results', 'standings',
    'documents', 'document_reads', 'alerts', 'alert_reads', 'push_tokens', 'guide_sections',
    'channels', 'messages', 'series_sources', 'series_updates', 'onboard_folders', 'onboard_videos'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Public season content: everyone, signed in or not. Crew edits.
do $$
declare t text;
begin
  foreach t in array array['championships', 'cars', 'events', 'sessions', 'event_links', 'team_results', 'standings'] loop
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "crew edits" on public.%I for all to authenticated using (public.is_crew()) with check (public.is_crew())', t);
  end loop;
end $$;

-- News: sponsors and visitors see 'everyone' posts, the team sees all.
create policy "read news" on public.news_posts for select to anon, authenticated
  using (audience = 'everyone' or public.is_team());
create policy "crew edits" on public.news_posts for all to authenticated using (public.is_crew()) with check (public.is_crew());

-- People: you see yourself; the team sees each other. Crew edits roles, cars, job titles.
create policy "own profile or team" on public.profiles for select to authenticated using (id = auth.uid() or public.is_team());
create policy "crew edits profiles" on public.profiles for update to authenticated using (public.is_crew()) with check (public.is_crew());
create policy "crew manages invites" on public.invites for all to authenticated using (public.is_crew()) with check (public.is_crew());

-- Crew roster, travel plans and the team guide: team only.
do $$
declare t text;
begin
  foreach t in array array['crew_assignments', 'travel_items', 'travel_members', 'guide_sections', 'onboard_folders', 'onboard_videos'] loop
    execute format('create policy "team reads" on public.%I for select to authenticated using (public.is_team())', t);
    execute format('create policy "crew edits" on public.%I for all to authenticated using (public.is_crew()) with check (public.is_crew())', t);
  end loop;
end $$;

-- Documents and alerts: only the people they target; crew sees all and every read receipt.
create policy "read targeted documents" on public.documents for select to authenticated using (public.is_targeted(target_type, target_role, target_car));
create policy "crew edits" on public.documents for all to authenticated using (public.is_crew()) with check (public.is_crew());
create policy "read receipts" on public.document_reads for select to authenticated using (member_id = auth.uid() or public.is_crew());
create policy "confirm read" on public.document_reads for insert to authenticated with check (member_id = auth.uid());
create policy "read targeted alerts" on public.alerts for select to authenticated using (public.is_targeted(target_type, target_role, target_car));
create policy "crew sends alerts" on public.alerts for insert to authenticated with check (public.is_crew());
create policy "alert receipts" on public.alert_reads for select to authenticated using (member_id = auth.uid() or public.is_crew());
create policy "mark alert read" on public.alert_reads for insert to authenticated with check (member_id = auth.uid());
create policy "own push tokens" on public.push_tokens for all to authenticated using (member_id = auth.uid()) with check (member_id = auth.uid());

-- Messaging: only members of a channel's roles read and post; private chats between team members.
create policy "read channels" on public.channels for select to authenticated using (public.my_role() = any (roles));
create policy "crew edits" on public.channels for all to authenticated using (public.is_crew()) with check (public.is_crew());
create policy "read messages" on public.messages for select to authenticated
  using (
    exists (select 1 from public.channels c where c.id = channel_id and public.my_role() = any (c.roles))
    or (channel_id is null and auth.uid() in (author_id, recipient_id))
  );
create policy "post messages" on public.messages for insert to authenticated
  with check (
    author_id = auth.uid() and (
      exists (select 1 from public.channels c where c.id = channel_id and public.my_role() = any (c.roles))
      or (channel_id is null and recipient_id is not null and public.is_team())
    )
  );

-- Series pages and what was found on them.
create policy "public read" on public.series_sources for select to anon, authenticated using (true);
create policy "crew edits" on public.series_sources for all to authenticated using (public.is_crew()) with check (public.is_crew());
create policy "read series updates" on public.series_updates for select to anon, authenticated using (not team_only or public.is_team());

-- Files: a private 'documents' bucket. The team reads, crew uploads.
insert into storage.buckets (id, name, public) values ('documents', 'documents', false) on conflict (id) do nothing;
create policy "team reads document files" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and public.is_team());
create policy "crew uploads document files" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and public.is_crew());
create policy "crew edits document files" on storage.objects for update to authenticated
  using (bucket_id = 'documents' and public.is_crew());
create policy "crew deletes document files" on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and public.is_crew());

-- Live updates in the app for new messages, alerts, documents and series updates.
alter publication supabase_realtime add table public.messages, public.alerts, public.documents, public.series_updates;
