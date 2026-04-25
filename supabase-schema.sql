-- profiles
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  nickname text not null,
  stage text not null default 'ROOKIE',
  total_points integer not null default 0,
  visit_count integer not null default 0,
  created_at timestamptz not null default now()
);
alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = user_id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = user_id);
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
create policy "Users can insert own checkins" on checkins for insert with check (auth.uid() = user_id);

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
create policy "Users can insert own points" on points for insert with check (auth.uid() = user_id);

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
