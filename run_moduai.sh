#!/usr/bin/env bash
# 모두의 AI: clone -> Node/dependencies -> environment check -> Vite.
set -euo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/package.json" && -f "$SCRIPT_DIR/src/App.tsx" ]]; then
  DEFAULT_PROJECT_DIR="$SCRIPT_DIR"
else
  DEFAULT_PROJECT_DIR="$SCRIPT_DIR/moduAI"
fi
PROJECT_DIR="${MODUAI_DIR:-$DEFAULT_PROJECT_DIR}"
PORT=5174
ACTION=run
OPEN=1
usage() {
  cat <<'EOF'
사용법: bash run_moduai.sh [--dir PATH] [--port 5174] [--no-open]
       bash run_moduai.sh --setup | --check | --build
  기본: 저장소 준비, 의존성 설치, Supabase 설정 확인 후 개발 서버 실행
  --setup: 준비·설정까지만 / --check: 설치·파일 변경 없이 확인
  --build: 준비·설정 후 dist 빌드 / 종료: 실행 터미널에서 Ctrl+C
비공개 저장소 접근 권한과 Git 인증이 필요합니다. 기존 폴더는 pull하지 않습니다.
EOF
}
die() { printf '%s\n' "$*" >&2; exit 1; }
while (($#)); do
  case "$1" in
    --help|-h) usage; exit 0 ;;
    --dir|--port) (($# >= 2)) || die "$1 뒤에 값이 필요합니다."
      if [[ "$1" == --dir ]]; then PROJECT_DIR="$2"; else PORT="$2"; fi; shift 2 ;;
    --setup) ACTION=setup; shift ;;
    --check) ACTION=check; shift ;;
    --build) ACTION=build; shift ;;
    --no-open) OPEN=0; shift ;;
    *) die "알 수 없는 옵션: $1 (--help 참고)" ;;
  esac
done
[[ "$PORT" =~ ^[0-9]{1,5}$ ]] || die '포트는 1~65535 숫자여야 합니다.'
PORT=$((10#$PORT))
((PORT >= 1 && PORT <= 65535)) || die '포트는 1~65535여야 합니다.'
[[ -f "$SCRIPT_DIR/project_tutorial/modu_env.mjs" ]] || die 'project_tutorial/ 폴더를 스크립트와 함께 두세요.'
if [[ ! -d "$PROJECT_DIR" ]]; then
  [[ "$ACTION" != check ]] || die "저장소 없음: $PROJECT_DIR"
  command -v git >/dev/null || die 'Git을 먼저 설치하세요.'
  printf '모두의 AI를 내려받습니다: %s\n' "$PROJECT_DIR"
  if command -v gh >/dev/null && gh auth status >/dev/null 2>&1; then
    gh repo clone PGH-snfl/moduAI "$PROJECT_DIR" -- --depth 1 || die '저장소 다운로드 실패. GitHub 접근 권한을 확인하세요.'
  else
    git clone --depth 1 https://github.com/PGH-snfl/moduAI.git "$PROJECT_DIR" || die 'Git 인증이 필요합니다. gh auth login 후 gh auth setup-git을 실행하거나, 전체 저장소 ZIP을 풀고 --dir로 지정하세요. GitHub 계정 비밀번호로 HTTPS Git 인증은 할 수 없습니다.'
  fi
fi
[[ -f "$PROJECT_DIR/package.json" && -f "$PROJECT_DIR/package-lock.json" && -f "$PROJECT_DIR/src/App.tsx" ]] || die '모두의 AI 전체 저장소 폴더를 지정하세요.'
cd -- "$PROJECT_DIR"
node_ok() {
  command -v node >/dev/null && node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit((a===20&&b>=19)||(a===22&&b>=12)?0:1)' >/dev/null 2>&1
}
if ! node_ok; then
  NVM_SCRIPT="${NVM_DIR:-$HOME/.nvm}/nvm.sh"
  [[ -s "$NVM_SCRIPT" ]] || die 'Node 20.19+ 또는 22.12+(23 미만)가 필요합니다. 권장: nvm install 20 && nvm use 20'
  set +u
  # Select Node for this launcher; retain any existing nvm default alias.
  source "$NVM_SCRIPT" --no-use
  if [[ "$ACTION" == check ]]; then
    nvm use 20 >/dev/null || nvm use 22 >/dev/null || die '호환 Node가 설치되지 않았습니다. nvm install 20'
  else
    nvm install 20
    nvm use 20
  fi
  set -u
fi
node_ok || die '호환되는 Node 버전을 선택하지 못했습니다.'
command -v npm >/dev/null || die 'npm을 찾지 못했습니다.'
node -e 'if(JSON.parse(require("fs").readFileSync("package.json")).name!=="modu-ai")process.exit(1)' || die 'moduAI 저장소가 아닙니다.'
STAMP="$(node -e 'const f=require("fs"),h=require("crypto").createHash("sha256");for(const p of ["package.json","package-lock.json"])h.update(f.readFileSync(p));h.update(process.versions.node);console.log(h.digest("hex"))')"
INSTALLED=''
[[ ! -f node_modules/.tutorial-deps.sha256 ]] || INSTALLED="$(cat node_modules/.tutorial-deps.sha256)"
if [[ "$ACTION" == check ]]; then
  [[ -f node_modules/vite/dist/node/index.js ]] || die '의존성 없음: 먼저 --setup을 실행하세요.'
elif [[ "$INSTALLED" != "$STAMP" || ! -f node_modules/vite/dist/node/index.js ]]; then
  # React 19 and react-helmet-async 2.x have conflicting declared peer ranges.
  # Keep the existing lockfile and versions; do not run npm audit fix.
  npm ci --legacy-peer-deps --include=dev --no-audit --no-fund
  printf '%s\n' "$STAMP" > node_modules/.tutorial-deps.sha256
fi
ENV_ACTION=configure
[[ "$ACTION" != check ]] || ENV_ACTION=check
node "$SCRIPT_DIR/project_tutorial/modu_env.mjs" "$PWD" "$ENV_ACTION" "$([[ "$ACTION" == build ]] && printf production || printf development)"
case "$ACTION" in
  check) printf '파일·Node·환경변수 형식 확인 완료. DB 연결·로그인 검증은 별도입니다.\n'; exit 0 ;;
  setup) printf '준비 완료. bash "%s/run_moduai.sh" --dir "%s" 로 실행하세요.\n' "$SCRIPT_DIR" "$PWD"; exit 0 ;;
  build) exec npm run build ;;
esac
printf '모두의 AI: http://127.0.0.1:%s (종료: Ctrl+C)\n' "$PORT"
ARGS=(run dev -- --host 127.0.0.1 --port "$PORT" --strictPort)
((OPEN == 0)) || ARGS+=(--open)
exec npm "${ARGS[@]}"
