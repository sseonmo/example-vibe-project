# Stop 훅 검증용 타깃 — ~/.claude/hooks/verify.sh가 npm run build 대신 이것을 실행한다.
# (next build가 .next/types를 지우면서 프로젝트 훅의 typecheck와 충돌하는 race 방지)
verify:
	npm run typecheck && npm run lint && npm test
