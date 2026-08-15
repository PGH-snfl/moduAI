-- traffic_stats RLS 정책 수정
-- 익명 사용자도 트래픽 데이터를 기록할 수 있도록 설정

-- 기존 정책 삭제 (있는 경우)
drop policy if exists "Enable insert for anonymous users" on public.traffic_stats;
drop policy if exists "Enable insert for all users" on public.traffic_stats;

-- 익명 사용자 INSERT 권한 추가
create policy "Enable insert for anonymous users" 
on public.traffic_stats 
for insert 
to anon
with check (true);

-- 인증된 사용자도 INSERT 가능 (혹시 모를 경우 대비)
create policy "Enable insert for authenticated users" 
on public.traffic_stats 
for insert 
to authenticated
with check (true);

-- 정책 확인
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies 
where tablename = 'traffic_stats';
