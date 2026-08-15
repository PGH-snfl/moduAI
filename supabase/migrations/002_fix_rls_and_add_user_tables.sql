-- ============================================
-- 스키마 업데이트: RLS 정책 수정 및 user_favorites 테이블 추가
-- ============================================

-- 1. traffic_stats 테이블 RLS 정책 수정
-- 익명 사용자도 트래픽 데이터를 기록할 수 있도록 설정

-- 기존 정책 삭제 (있는 경우)
drop policy if exists "Enable insert for anonymous users" on public.traffic_stats;
drop policy if exists "Enable insert for all users" on public.traffic_stats;
drop policy if exists "Enable insert for authenticated users" on public.traffic_stats;

-- 익명 사용자 INSERT 권한 추가
create policy "Enable insert for anonymous users" 
on public.traffic_stats 
for insert 
to anon
with check (true);

-- 인증된 사용자도 INSERT 가능
create policy "Enable insert for authenticated users" 
on public.traffic_stats 
for insert 
to authenticated
with check (true);

-- 2. user_favorites 테이블 생성 (MyPage용)
create table if not exists public.user_favorites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_id uuid not null references public.tools(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, tool_id)
);

-- user_favorites RLS 정책
alter table public.user_favorites enable row level security;

-- 사용자는 자신의 즐겨찾기만 조회 가능
create policy "Enable read own favorites" 
on public.user_favorites 
for select 
to authenticated
using (auth.uid() = user_id);

-- 사용자는 자신의 즐겨찾기만 추가 가능
create policy "Enable insert own favorites" 
on public.user_favorites 
for insert 
to authenticated
with check (auth.uid() = user_id);

-- 사용자는 자신의 즐겨찾기만 삭제 가능
create policy "Enable delete own favorites" 
on public.user_favorites 
for delete 
to authenticated
using (auth.uid() = user_id);

-- 3. user_profiles 테이블 생성 (사용자 관심사 분석용)
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  interests text[], -- 관심 카테고리 목록
  preferred_categories text[], -- 선호하는 AI 카테고리
  usage_stats jsonb default '{}', -- 사용 통계
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- user_profiles RLS 정책
alter table public.user_profiles enable row level security;

create policy "Enable read own profile" 
on public.user_profiles 
for select 
to authenticated
using (auth.uid() = id);

create policy "Enable update own profile" 
on public.user_profiles 
for update 
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Enable insert own profile" 
on public.user_profiles 
for insert 
to authenticated
with check (auth.uid() = id);

-- 4. user_activities 테이블 생성 (사용자 활동 로그 - 관심사 분석용)
create table if not exists public.user_activities (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null, -- 'view', 'click', 'favorite', 'search'
  tool_id uuid references public.tools(id) on delete set null,
  metadata jsonb default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- user_activities RLS 정책
alter table public.user_activities enable row level security;

create policy "Enable read own activities" 
on public.user_activities 
for select 
to authenticated
using (auth.uid() = user_id);

create policy "Enable insert own activities" 
on public.user_activities 
for insert 
to authenticated
with check (auth.uid() = user_id);

-- 5. 정책 확인
select 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
from pg_policies 
where tablename in ('traffic_stats', 'user_favorites', 'user_profiles', 'user_activities')
order by tablename, policyname;
