#!/usr/bin/env bash
  INPUT=$(cat)

  # git commit 명령이 아니면 통과
  echo "$INPUT" | grep -q '"command"[[:space:]]*:[[:space:]]*"[^"]*git commit' || exit 0

  cd "$CLAUDE_PROJECT_DIR" || exit 0
  branch=$(git branch --show-current)

  if [ "$branch" = "main" ]; then
    echo "❌ main 브랜치 직접 커밋 금지 — 브랜치를 먼저 만드세요" >&2
    exit 2
  fi
  exit 0