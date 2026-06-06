#!/usr/bin/env bash
  INPUT=$(cat)

  # 무한 루프 가드 — 사용자 레벨 verify.sh의 17~26행과 같은 패턴
  echo "$INPUT" | grep -q '"stop_hook_active"[[:space:]]*:[[:space:]]*true' && exit 0

  cd "$CLAUDE_PROJECT_DIR" || exit 0

  # 훅 환경에는 셸 프로필이 없어 nvm node가 PATH에 없을 수 있음 — 항상 nvm 로드
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  # nvm 로드 후에도 없으면 직접 PATH에 추가
  if ! command -v npm >/dev/null 2>&1; then
    export PATH="$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node | tail -1)/bin:$PATH"
  fi

  npm run typecheck || { echo "❌ typecheck 실패" >&2; exit 2; }
  npm run lint      || { echo "❌ lint 실패" >&2; exit 2; }
  exit 0

