-- Absolute Racing Team app: database schema with role-based access.
-- Run in the Supabase SQL editor (or as a migration).

create type public.user_role as enum ('management', 'driver', 'sponsor');

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null default '',
  role public.user_role not null default 'sponsor',
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

create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  circuit text not null default '',
  location text not null default '',
  start_date date not null,
  end_date date not null,
  summary text not null default '',
  created_at timestamptz not null default now()
);

create table public.timetable_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events on delete cascade,
  starts_at timestamptz not null,
  title text not null
);

create type public.travel_kind as enum ('flight', 'hotel', 'transfer', 'other');

create table public.travel_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events on delete cascade,
  kind public.travel_kind not null,
  title text not null,
  details text not null default '',
  starts_at timestamptz
);

create type public.link_kind as enum ('results', 'video', 'onboard', 'other');

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
  channel_id uuid not null references public.channels on delete cascade,
  author_id uuid not null references public.profiles default auth.uid(),
  body text not null,
  sent_at timestamptz not null default now()
);

-- Row-level security -----------------------------------------------------
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.timetable_items enable row level security;
alter table public.travel_items enable row level security;
alter table public.event_links enable row level security;
alter table public.news_posts enable row level security;
alter table public.guide_sections enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;

create policy "own profile or team" on public.profiles for select using (id = auth.uid() or public.is_team());
create policy "management edits profiles" on public.profiles for update using (public.is_management());

-- Everyone signed in sees events, timetables, links; only management edits.
create policy "read events" on public.events for select to authenticated using (true);
create policy "read timetable" on public.timetable_items for select to authenticated using (true);
create policy "read links" on public.event_links for select to authenticated using (true);
create policy "manage events" on public.events for all using (public.is_management()) with check (public.is_management());
create policy "manage timetable" on public.timetable_items for all using (public.is_management()) with check (public.is_management());
create policy "manage links" on public.event_links for all using (public.is_management()) with check (public.is_management());

-- Travel plans and the team guide are team only.
create policy "team reads travel" on public.travel_items for select using (public.is_team());
create policy "manage travel" on public.travel_items for all using (public.is_management()) with check (public.is_management());
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
  using (exists (select 1 from public.channels c where c.id = channel_id and public.my_role() = any (c.roles)));
create policy "post messages" on public.messages for insert
  with check (author_id = auth.uid() and exists (select 1 from public.channels c where c.id = channel_id and public.my_role() = any (c.roles)));

alter publication supabase_realtime add table public.messages;
