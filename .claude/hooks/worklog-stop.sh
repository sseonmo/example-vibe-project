#!/usr/bin/env bash
#
# Stop 훅 — 구현 작업이 끝난 턴에서 작업일지 작성을 유도한다.
#
# 동작 원리:
#   - 이번 턴에 코드 변경(uncommitted)이 있는데 오늘자 작업일지
#     (docs/work-logs/YYYY-MM-DD.md)가 마지막 코드 변경보다 오래됐으면
#     응답 종료를 막고(decision: block) 3~5줄 작업 내역 작성을 지시한다.
#   - 작업일지를 쓰면 mtime이 최신이 되어 통과 → 루프가 반드시 종료된다.
#   - stop_hook_active(직전에 이 훅이 이미 block한 턴)면 다시 막지 않는다.
#
# 입력: stdin 으로 Stop 이벤트 JSON

INPUT=$(cat)

# 1) 무한 루프 방지: 이미 이 훅의 block 으로 이어진 턴이면 통과
if command -v jq >/dev/null 2>&1; then
  active=$(printf '%s' "$INPUT" | jq -r '.stop_hook_active // false')
else
  active=$(printf '%s' "$INPUT" | grep -q '"stop_hook_active"[[:space:]]*:[[:space:]]*true' && echo true || echo false)
fi
[ "$active" = "true" ] && exit 0

cd "$CLAUDE_PROJECT_DIR" || exit 0

# 2) 변경된 파일 수집 — '구현(코드) 변경'만 센다.
#    문서(docs/ 전체, 모든 *.md)와 훅·스킬 설정(.claude/)은 작업일지 대상이 아님.
#    (porcelain 의 'XY path' 에서 앞 3글자 제거, rename 은 '-> ' 뒤가 새 경로)
changed=$(git status --porcelain 2>/dev/null \
  | cut -c4- \
  | sed 's/^.* -> //' \
  | grep -v -e '^docs/' -e '^\.claude/' -e '\.md$')
[ -n "$changed" ] || exit 0   # 코드 변경 없는 턴(질문·문서 작업 등)은 조용히 통과

# 3) 오늘자 작업일지가 마지막 코드 변경보다 최신이면 통과 (이미 기록함)
today=$(date +%F)
wl="docs/work-logs/${today}.md"
if [ -f "$wl" ]; then
  wl_mtime=$(stat -f %m "$wl" 2>/dev/null || echo 0)
  latest=0
  while IFS= read -r f; do
    [ -e "$f" ] || continue
    m=$(stat -f %m "$f" 2>/dev/null || echo 0)
    [ "$m" -gt "$latest" ] && latest=$m
  done <<EOF
$changed
EOF
  [ "$wl_mtime" -ge "$latest" ] && exit 0
fi

# 4) 작업일지가 없거나 오래됐으면 종료를 막고 작성을 지시
cat <<JSON
{
  "decision": "block",
  "reason": "구현 작업이 끝났는데 이번 작업 내역이 작업일지에 없습니다. ${wl} 에 아래 형식으로 추가하세요(파일이 없으면 '# ${today} 작업일지' 헤더와 함께 생성). 작성 후에는 다른 코드를 수정하지 말고 응답을 마치세요.\n\n## HH:MM 작업 제목\n- 변경 요점을 3~5줄로: 무엇을 바꿨는지, 왜 바꿨는지, 어떻게 검증했는지"
}
JSON
exit 0
