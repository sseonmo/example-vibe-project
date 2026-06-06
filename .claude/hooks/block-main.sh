#!/usr/bin/env bash
INPUT=$(cat)

# git commit 명령이 아니면 통과 — `git -C <경로> commit` 형태도 트리거에 포함
# (git merge 는 공인된 main 반영 경로이므로 검사하지 않음)
echo "$INPUT" | grep -qE '"command"[[:space:]]*:[[:space:]]*"[^"]*git (commit|-C [^"]+ commit)' || exit 0

# 검사할 후보 디렉터리 수집 — "명령이 실제 실행되는 위치"를 모두 본다.
# worktree 세션에서는 $CLAUDE_PROJECT_DIR(worktree)와 실제 커밋 위치(원본 저장소)가
# 갈라질 수 있으므로 한 곳만 보면 우회된다:
#   1) 훅 입력 JSON 의 cwd (셸의 현재 작업 디렉터리)
#   2) 명령 안의 `cd <절대경로>` / `git -C <경로>` 대상
#   3) $CLAUDE_PROJECT_DIR (기존 동작 유지용 폴백)
candidates=()

hook_cwd=$(printf '%s' "$INPUT" | sed -n 's/.*"cwd"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
[ -n "$hook_cwd" ] && candidates+=("$hook_cwd")

while IFS= read -r p; do
  candidates+=("$p")
done < <(printf '%s' "$INPUT" | grep -oE 'cd +(/|~)[^ ;&|\\"]*' | sed 's/^cd *//')

while IFS= read -r p; do
  candidates+=("$p")
done < <(printf '%s' "$INPUT" | grep -oE '\-C +[^ ;&|\\"]+' | sed 's/^-C *//')

[ -n "$CLAUDE_PROJECT_DIR" ] && candidates+=("$CLAUDE_PROJECT_DIR")

for dir in "${candidates[@]}"; do
  dir="${dir/#\~/$HOME}"
  [ -d "$dir" ] || continue
  branch=$(git -C "$dir" branch --show-current 2>/dev/null)
  if [ "$branch" = "main" ]; then
    echo "❌ main 브랜치 직접 커밋 금지 — 브랜치를 먼저 만드세요 (감지 위치: $dir)" >&2
    exit 2
  fi
done
exit 0
