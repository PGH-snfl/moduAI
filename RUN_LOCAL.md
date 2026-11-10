# 모두의 AI 한 번에 실행하기

저장소 루트에서:

```bash
bash run_moduai.sh
```

Node와 의존성을 준비하고 Supabase 공개 설정을 확인한 뒤 `http://127.0.0.1:5174`를 엽니다. 종료는 실행 터미널에서 `Ctrl+C`입니다. 스크립트는 저장소 내부에서 자기 폴더를 사용하며 중첩 clone이나 자동 pull을 하지 않습니다.

## 최초 준비

- Node 20.19 이상 또는 22.12 이상(23 미만)과 npm이 필요합니다. 기존 nvm이 있으면 Node 20을 설치·선택합니다. 이미 등록된 nvm 기본 별칭은 유지하며 첫 Node 설치라면 nvm이 기본 별칭을 만들 수 있습니다.
- Supabase Project URL과 anon/public 또는 publishable 키가 필요합니다. 터미널에서 처음 실행할 때 누락된 값을 입력하면 `.env.local`에 추가합니다. 기존 파일을 덮어쓰지 않습니다.
- `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`를 이미 설정했다면 재입력하지 않습니다. 서버의 `service_role`·비밀키는 프론트엔드에 넣지 않습니다.
- 현재 코드는 실제 Supabase를 조회합니다. 저장소 다운로드가 DB 데이터·로그인·관리자 권한을 복제하지는 않습니다. DB migration/seed와 배포는 이 스크립트에서 수행하지 않습니다.

## 옵션

```bash
bash run_moduai.sh --setup                # 준비·환경 설정까지만
bash run_moduai.sh --check                # 설치·파일 쓰기 없이 현재 설정 확인
bash run_moduai.sh --build                # TypeScript 검사·dist 생성
bash run_moduai.sh --port 5175 --no-open   # 포트 변경·브라우저 자동 열기 생략
bash run_moduai.sh --dir /path/to/moduAI   # 다른 전체 저장소 지정
```

`run_moduai.sh`와 `project_tutorial/modu_env.mjs`가 함께 필요합니다. 스크립트를 저장소 외부로 복사한 경우에만 옆의 `moduAI/`를 기본 대상으로 사용하고, 그 폴더가 없으면 저장소를 clone합니다. 이 경우 비공개 GitHub 접근 권한과 Git 인증이 필요합니다.

React 19와 react-helmet-async 2.x의 peer 선언 충돌 때문에 잠금 파일을 유지한 `npm ci --legacy-peer-deps`를 사용합니다. 모든 화면 호환을 보증하는 옵션은 아닙니다. 이미 사용 중인 포트는 다른 포트로 자동 변경하거나 기존 프로세스를 종료하지 않고 오류로 알립니다.

## 검증 범위

2026-11-10: Node 20.20.2에서 소스 사본의 설치·TypeScript/Vite 빌드 통과. 저장소 루트 인식, 한글·공백 경로, 환경 누락·비밀키 거부, 포트 충돌, 로컬 개발 서버 응답과 종료를 검사했습니다. 실제 Supabase 데이터·로그인은 이번에 검증하지 않았습니다.
