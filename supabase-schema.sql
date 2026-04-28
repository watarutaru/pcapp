-- profiles
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  nickname text not null,
  role text not null default 'member' check (role in ('member', 'admin')),
  stage text not null default 'ROOKIE',
  total_points integer not null default 0,
  visit_count integer not null default 0,
  created_at timestamptz not null default now()
);
-- 管理者を付与するには以下を実行（Supabase SQL Editor）:
-- UPDATE profiles SET role = 'admin' WHERE user_id = '<対象ユーザーのUUID>';
alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = user_id or is_admin());
create policy "Users can update own profile" on profiles for update using (auth.uid() = user_id or is_admin());
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = user_id);

-- lives
create table if not exists lives (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date timestamptz not null,
  venue text not null,
  description text,
  created_at timestamptz not null default now()
);
alter table lives enable row level security;
create policy "Anyone can view lives" on lives for select using (true);

-- checkins
create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  live_id uuid references lives(id) on delete cascade not null,
  checked_in_at timestamptz not null default now(),
  unique(user_id, live_id)
);
alter table checkins enable row level security;
create policy "Users can view own checkins" on checkins for select using (auth.uid() = user_id);
create policy "Users can insert own checkins" on checkins for insert with check (auth.uid() = user_id or is_admin());

-- points
create table if not exists points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);
alter table points enable row level security;
create policy "Users can view own points" on points for select using (auth.uid() = user_id);
create policy "Users can insert own points" on points for insert with check (auth.uid() = user_id or is_admin());

-- diaries
create table if not exists diaries (
  id uuid primary key default gen_random_uuid(),
  author text not null check (author in ('wataru', 'tamaru')),
  content text not null,
  created_at timestamptz not null default now()
);
alter table diaries enable row level security;
create policy "Anyone can view diaries" on diaries for select using (true);

-- push_tokens
create table if not exists push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  token text not null,
  created_at timestamptz not null default now()
);
alter table push_tokens enable row level security;
create policy "Users can manage own push token" on push_tokens for all using (auth.uid() = user_id);

-- adminロール判定ヘルパー（RLSポリシー内で使用）
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- visit_count trigger (checkin時にprofilesのvisit_countを自動更新)
create or replace function increment_visit_count()
returns trigger as $$
begin
  update profiles set visit_count = visit_count + 1 where user_id = new.user_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_checkin_insert
  after insert on checkins
  for each row execute function increment_visit_count();

-- indexes
create index if not exists idx_lives_date on lives(date desc);
create index if not exists idx_checkins_user_id on checkins(user_id);
create index if not exists idx_checkins_live_id on checkins(live_id);
create index if not exists idx_points_user_id_created_at on points(user_id, created_at desc);
create index if not exists idx_diaries_created_at on diaries(created_at desc);

-- auto-create profile on signup (works even when email confirmation is enabled)
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (user_id, nickname)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1))
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- migration: 既存DBへの適用（新規作成時は不要）
-- alter table profiles add column if not exists role text not null default 'member' check (role in ('member', 'admin'));

-- migration: RLSポリシーの更新（既存DBへの適用）
-- create or replace function is_admin()
-- returns boolean as $$
--   select exists (select 1 from profiles where user_id = auth.uid() and role = 'admin');
-- $$ language sql security definer stable;
--
-- drop policy if exists "Users can view own profile" on profiles;
-- create policy "Users can view own profile" on profiles for select using (auth.uid() = user_id or is_admin());
-- drop policy if exists "Users can update own profile" on profiles;
-- create policy "Users can update own profile" on profiles for update using (auth.uid() = user_id or is_admin());
-- drop policy if exists "Users can insert own checkins" on checkins;
-- create policy "Users can insert own checkins" on checkins for insert with check (auth.uid() = user_id or is_admin());
-- drop policy if exists "Users can insert own points" on points;
-- create policy "Users can insert own points" on points for insert with check (auth.uid() = user_id or is_admin());
