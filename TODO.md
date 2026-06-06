# TODO.md — 진행할 실습 작업

> IDEAS.md에서 옮겨온 작업 목록. 변경 파일 1~3개, 외부 의존성 추가 없거나 1개 이하가 원칙.

## [x] #1. `/agent-loop` 페이지에 단계별 호버 툴팁 추가 (docs/plans/001 구현 완료)

**파일**: `components/LoopDiagram.tsx`, `app/agent-loop/page.tsx`

- 6개 노드에 마우스 호버 시 해당 단계의 더 자세한 설명이 카드로 뜨도록.
- 키보드 포커스(Tab)도 동작해야 함 (a11y).
- **성공 기준**: 마우스 호버 / Tab 포커스 모두에서 툴팁이 보이고, ESC로 닫힘.

## [x] #2. `/memory-hierarchy` 페이지에 다크/라이트 토글 (docs/plans/002 구현 완료)

**파일**: `app/layout.tsx`, `app/memory-hierarchy/page.tsx`, 새 `components/ThemeToggle.tsx`

- 현재는 다크 전용. CSS 변수만 토글하면 라이트도 OK (`--color-bg`, `--color-fg` 등).
- 선호 저장은 `localStorage` 하나면 충분 (쿠키 불필요).
- **성공 기준**: 토글 후 새로고침해도 선택이 유지됨.

## [x] #3. `POST /api/feedback` 엔드포인트 완성 ⭐ (docs/plans/003 구현 완료)

**파일**: `app/api/feedback/route.ts`, 새 `lib/feedback-store.ts`

- body 검증: `conceptSlug` (string, concepts에 존재), `rating` (1~5 정수), `comment` (string, 선택, ≤200자)
- 메모리 저장 (재시작 시 비워져도 OK). 또는 `.feedback.json`에 append.
- 응답: 성공 시 `{ id, savedAt }`, 검증 실패 시 400 + `AppError` 응답 일관 형식.
- 테스트 1개 추가 (검증 실패 케이스 + 성공 케이스).
- **성공 기준**: 페이지의 피드백 폼에서 전송 → 200 응답 + "전송 완료" 표시.

## [ ] #3-후속. `FeedbackForm` 실패 문구 갱신 (docs/plans/003 결정 #11에서 이연)

**파일**: `components/FeedbackForm.tsx` (1줄)

- #3 구현 후에도 검증 실패 시 "아직 stub입니다" 거짓 문구가 남음 (docs/plans/003 /autoplan 리뷰 F-3, 2026-06-06 게이트에서 이연 결정).
- 일반 실패 문구(예: "전송 실패 — 입력을 확인해 주세요")로 교체. **별도 승인·별도 커밋** 필요 (미요청 파일 수정 금지 규칙).
- Ch03 #7 (axios→fetch)이 같은 파일을 다루므로 그때 함께 처리해도 됨.
