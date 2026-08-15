import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function LegalPage() {
  const { pathname } = useLocation();
  const isPrivacy = pathname === '/privacy';

  return (
    <main className="container max-w-3xl py-12 sm:py-20">
      <h1 className="text-3xl font-bold">{isPrivacy ? '개인정보처리방침' : '이용약관'}</h1>
      <p className="mt-2 text-sm text-muted-foreground">시행일: 2026년 8월 11일</p>
      <div className="mt-10 space-y-8 leading-7 text-muted-foreground">
        {isPrivacy ? (
          <>
            <section><h2 className="text-xl font-semibold text-foreground">수집하는 정보</h2><p className="mt-2">로그인 시 이메일, 이름과 같은 계정 정보를 수집할 수 있으며 즐겨찾기, 리뷰, 도구 제보 기록을 서비스 제공을 위해 저장합니다.</p></section>
            <section><h2 className="text-xl font-semibold text-foreground">이용 목적과 보관</h2><p className="mt-2">계정 식별, 맞춤 기능, 서비스 개선과 부정 이용 방지에 사용합니다. 관련 법령 또는 서비스 운영에 필요한 기간 동안 보관한 뒤 삭제합니다.</p></section>
            <section><h2 className="text-xl font-semibold text-foreground">외부 서비스</h2><p className="mt-2">인증과 데이터 저장을 위해 Supabase 등 외부 처리 서비스를 사용할 수 있습니다. AI 도구 외부 링크를 방문하면 해당 서비스의 정책이 적용됩니다.</p></section>
            <section><h2 className="text-xl font-semibold text-foreground">사용자의 권리</h2><p className="mt-2">사용자는 자신의 정보 열람·정정·삭제와 계정 탈퇴를 요청할 수 있습니다. 정식 서비스 운영 전 문의 채널을 별도로 고지합니다.</p></section>
          </>
        ) : (
          <>
            <section><h2 className="text-xl font-semibold text-foreground">서비스의 목적</h2><p className="mt-2">모두의 AI는 AI 도구의 기능, 가격과 이용 조건을 탐색하고 비교할 수 있도록 정보를 제공합니다.</p></section>
            <section><h2 className="text-xl font-semibold text-foreground">정보의 정확성</h2><p className="mt-2">정보를 지속적으로 검증하지만 업체 정책은 변경될 수 있습니다. 구매 또는 도입 전 공식 웹사이트에서 최신 조건을 확인해야 합니다.</p></section>
            <section><h2 className="text-xl font-semibold text-foreground">사용자 콘텐츠</h2><p className="mt-2">리뷰와 제보에는 타인의 권리를 침해하거나 허위·불법인 내용을 등록할 수 없습니다. 운영 기준에 따라 해당 콘텐츠를 제한할 수 있습니다.</p></section>
            <section><h2 className="text-xl font-semibold text-foreground">제휴와 광고</h2><p className="mt-2">일부 외부 링크나 스폰서 영역에서 수익이 발생할 수 있으며, 광고 여부는 화면에 구분해 표시합니다.</p></section>
          </>
        )}
      </div>
      <Button asChild variant="outline" className="mt-10"><Link to="/login">로그인으로 돌아가기</Link></Button>
    </main>
  );
}
