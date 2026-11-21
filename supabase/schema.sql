-- Absolute Racing Team app: database schema with role-based access.
-- Run in the Supabase SQL editor (or as a migration).

create type public.user_role as enum ('management', 'driver', 'sponsor');

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null default '',
  role public.user_role not null default 'sponsor',
  job_title text not null default '',
  car_id uuid,
  phone text, -- only management can read other people's phone numbers (see profile_phones view)
  created_at timestamptz not null default now()
);

create or replace function public.my_role() returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_team() returns boolean
language sql stable as $$ select public.my_role() in ('management', 'driver') $$;

create or replace function public.is_management() returns boolean
language sql stable as $$ select public.my_role() = 'management' $$;

-- New sign-ups get a sponsor profile; management promotes people to driver/management.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.championships (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text not null
);

create table public.cars (
  id uuid primary key default gen_random_uuid(),
  number text not null,
  model text not null,
  championship_id uuid references public.championships
);

alter table public.profiles add constraint profiles_car_fk foreign key (car_id) references public.cars on delete set null;

create or replace function public.my_car() returns uuid
language sql stable security definer set search_path = public as $$
  select car_id from public.profiles where id = auth.uid()
$$;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  championship_id uuid references public.championships,
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
  event_id uuid not null references public.events on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  title text not null,
  car_id uuid references public.cars on delete cascade, -- null = whole team
  from_series boolean not null default false -- true = official timetable, replaced on each sync
);

create table public.crew_assignments (
  event_id uuid not null references public.events on delete cascade,
  member_id uuid not null references public.profiles on delete cascade,
  car_id uuid references public.cars on delete set null,
  duty text not null default '',
  primary key (event_id, member_id)
);

create type public.travel_kind as enum ('flight', 'train', 'rental', 'shuttle', 'hotel', 'restaurant', 'other');
create type public.travel_direction as enum ('outbound', 'onsite', 'return');

create table public.travel_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events on delete cascade,
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
  event_id uuid not null references public.events on delete cascade,
  kind public.link_kind not null,
  label text not null,
  url text not null
);

create type public.audience as enum ('everyone', 'team');

create table public.news_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  event_id uuid references public.events on delete set null,
  audience public.audience not null default 'everyone',
  published_at timestamptz not null default now()
);

-- Our finishing positions and championship standings, entered by management
-- (none of the series offers a public results feed).
create table public.team_results (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events on delete cascade,
  session text not null,
  car_id uuid not null references public.cars on delete cascade,
  position int not null,
  class_position int,
  class_name text,
  from_series boolean not null default false,
  unique (event_id, session, car_id)
);

create table public.standings (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships on delete cascade,
  title text not null,
  updated_at timestamptz not null default now(),
  rows jsonb not null default '[]' -- [{position, name, points, ours}]
);

-- Targeting: who a document or alert is for.
create type public.target_type as enum ('all', 'role', 'car');

create or replace function public.is_targeted(t public.target_type, r public.user_role, c uuid) returns boolean
language sql stable as $$
  select public.is_management()
      or (public.is_team() and (t = 'all' or (t = 'role' and r = public.my_role()) or (t = 'car' and c = public.my_car())))
$$;

create type public.doc_category as enum ('briefing', 'runplan', 'timetable', 'bulletin', 'media', 'other');

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category public.doc_category not null default 'other',
  event_id uuid references public.events on delete set null,
  storage_path text not null, -- file in the 'documents' storage bucket
  target_type public.target_type not null default 'all',
  target_role public.user_role,
  target_car uuid references public.cars on delete cascade,
  published_at timestamptz not null default now()
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
  sent_by uuid references public.profiles default auth.uid(), -- null = sent automatically (series sync)
  sent_at timestamptz not null default now(),
  target_type public.target_type not null default 'all',
  target_role public.user_role,
  target_car uuid references public.cars on delete cascade,
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
  id uuid primary key default gen_random_uuid(),
  name text not null,
  roles public.user_role[] not null default '{management,driver}'
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references public.channels on delete cascade, -- group chat
  recipient_id uuid references public.profiles on delete cascade, -- or private chat
  author_id uuid not null references public.profiles default auth.uid(),
  body text not null,
  sent_at timestamptz not null default now()
);

-- Row-level security -----------------------------------------------------
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.sessions enable row level security;
alter table public.championships enable row level security;
alter table public.cars enable row level security;
alter table public.crew_assignments enable row level security;
alter table public.documents enable row level security;
alter table public.document_reads enable row level security;
alter table public.alerts enable row level security;
alter table public.alert_reads enable row level security;
alter table public.push_tokens enable row level security;
alter table public.travel_members enable row level security;
alter table public.team_results enable row level security;
alter table public.standings enable row level security;
alter table public.travel_items enable row level security;
alter table public.event_links enable row level security;
alter table public.news_posts enable row level security;
alter table public.guide_sections enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;

-- Team members can see each other (phone numbers are hidden from non-management in the app,
-- and should be moved to a management-only table before launch).
create policy "own profile or team" on public.profiles for select using (id = auth.uid() or public.is_team());
create policy "management edits profiles" on public.profiles for update using (public.is_management());

-- Everyone signed in sees events, timetables, links; only management edits.
create policy "read events" on public.events for select to authenticated using (true);
create policy "read sessions" on public.sessions for select to authenticated using (true);
create policy "read championships" on public.championships for select to authenticated using (true);
create policy "read cars" on public.cars for select to authenticated using (true);
create policy "read links" on public.event_links for select to authenticated using (true);
create policy "read results" on public.team_results for select to authenticated using (true);
create policy "read standings" on public.standings for select to authenticated using (true);
create policy "manage results" on public.team_results for all using (public.is_management()) with check (public.is_management());
create policy "manage standings" on public.standings for all using (public.is_management()) with check (public.is_management());
create policy "manage events" on public.events for all using (public.is_management()) with check (public.is_management());
create policy "manage sessions" on public.sessions for all using (public.is_management()) with check (public.is_management());
create policy "manage championships" on public.championships for all using (public.is_management()) with check (public.is_management());
create policy "manage cars" on public.cars for all using (public.is_management()) with check (public.is_management());

-- Crew roster: team only.
create policy "team reads crew" on public.crew_assignments for select using (public.is_team());
create policy "manage crew" on public.crew_assignments for all using (public.is_management()) with check (public.is_management());

-- Documents and alerts: only the people they target; management sees all and every read receipt.
create policy "read targeted documents" on public.documents for select using (public.is_targeted(target_type, target_role, target_car));
create policy "manage documents" on public.documents for all using (public.is_management()) with check (public.is_management());
create policy "read receipts" on public.document_reads for select using (member_id = auth.uid() or public.is_management());
create policy "confirm read" on public.document_reads for insert with check (member_id = auth.uid());
create policy "read targeted alerts" on public.alerts for select using (public.is_targeted(target_type, target_role, target_car));
create policy "send alerts" on public.alerts for insert with check (public.is_management());
create policy "alert receipts" on public.alert_reads for select using (member_id = auth.uid() or public.is_management());
create policy "mark alert read" on public.alert_reads for insert with check (member_id = auth.uid());
create policy "own push tokens" on public.push_tokens for all using (member_id = auth.uid()) with check (member_id = auth.uid());
create policy "manage links" on public.event_links for all using (public.is_management()) with check (public.is_management());

-- Travel plans and the team guide are team only.
create policy "team reads travel" on public.travel_items for select using (public.is_team());
create policy "manage travel" on public.travel_items for all using (public.is_management()) with check (public.is_management());
create policy "team reads travel members" on public.travel_members for select using (public.is_team());
create policy "manage travel members" on public.travel_members for all using (public.is_management()) with check (public.is_management());
create policy "team reads guide" on public.guide_sections for select using (public.is_team());
create policy "manage guide" on public.guide_sections for all using (public.is_management()) with check (public.is_management());

-- News: sponsors see 'everyone' posts, team sees all.
create policy "read news" on public.news_posts for select to authenticated
  using (audience = 'everyone' or public.is_team());
create policy "manage news" on public.news_posts for all using (public.is_management()) with check (public.is_management());

-- Messaging: only members of a channel's roles read and post.
create policy "read channels" on public.channels for select using (public.my_role() = any (roles));
create policy "manage channels" on public.channels for all using (public.is_management()) with check (public.is_management());
create policy "read messages" on public.messages for select
  using (
    exists (select 1 from public.channels c where c.id = channel_id and public.my_role() = any (c.roles))
    or (channel_id is null and auth.uid() in (author_id, recipient_id))
  );
create policy "post messages" on public.messages for insert
  with check (
    author_id = auth.uid() and (
      exists (select 1 from public.channels c where c.id = channel_id and public.my_role() = any (c.roles))
      or (channel_id is null and recipient_id is not null and public.is_team())
    )
  );

-- Official series pages the app reads (see supabase/functions/sync-series).
-- adapter 'sro': GT World Challenge Asia, Japan Cup, IGTC sites (timetable, noticeboard, results).
-- adapter 'links': any page; new PDF links on it are listed as updates.
create table public.series_sources (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships on delete cascade,
  adapter text not null check (adapter in ('sro', 'links')),
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
  championship_id uuid not null references public.championships on delete cascade,
  event_id uuid references public.events on delete set null,
  kind text not null,
  section text not null default '', -- e.g. "Event Bulletin"
  title text not null,
  url text not null unique,
  team_only boolean not null default false, -- from the teams area: copied into documents, never shown to sponsors
  found_at timestamptz not null default now()
);

alter table public.series_sources enable row level security;
alter table public.series_updates enable row level security;
create policy "read sources" on public.series_sources for select to authenticated using (true);
create policy "manage sources" on public.series_sources for all using (public.is_management()) with check (public.is_management());
create policy "read series updates" on public.series_updates for select to authenticated using (not team_only or public.is_team());

-- Onboard footage: one folder per event and car, kept in a shared drive.
create table public.onboard_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_id uuid references public.events on delete set null,
  car_id uuid references public.cars on delete set null,
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
alter table public.onboard_folders enable row level security;
alter table public.onboard_videos enable row level security;
create policy "team reads onboard folders" on public.onboard_folders for select using (public.is_team());
create policy "manage onboard folders" on public.onboard_folders for all using (public.is_management()) with check (public.is_management());
create policy "team reads onboard videos" on public.onboard_videos for select using (public.is_team());
create policy "manage onboard videos" on public.onboard_videos for all using (public.is_management()) with check (public.is_management());

alter publication supabase_realtime add table public.series_updates;
alter publication supabase_realtime add table public.messages, public.alerts, public.documents;
