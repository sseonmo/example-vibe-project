#!/usr/bin/env bash
# Edit/Write 후 해당 파일을 Prettier로 자동 포맷하는 PostToolUse 훅
INPUT=$(cat)

f=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_response.filePath // empty')
[ -z "$f" ] && exit 0
[ -f "$f" ] || exit 0

cd "$CLAUDE_PROJECT_DIR" || exit 0
npx prettier --write --ignore-unknown "$f" >/dev/null 2>&1 || true
exit 0
