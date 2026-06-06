# IDEAS.md — Part 1 Ch01 통합 실습 후보 작업

> Plan → Worktree → Verify 한 사이클(90분)로 끝낼 수 있는 작은 작업 7개. 하나만 골라 진행하세요. 변경 파일 1~3개, 외부 의존성 추가 없거나 1개 이하가 원칙.

---

## #1. `/agent-loop` 페이지에 단계별 호버 툴팁 추가

**파일**: `components/LoopDiagram.tsx`, `app/agent-loop/page.tsx`

- 6개 노드에 마우스 호버 시 해당 단계의 더 자세한 설명이 카드로 뜨도록.
- 키보드 포커스(Tab)도 동작해야 함 (a11y).
- **성공 기준**: 마우스 호버 / Tab 포커스 모두에서 툴팁이 보이고, ESC로 닫힘.

## #2. `/memory-hierarchy` 페이지에 다크/라이트 토글

**파일**: `app/layout.tsx`, `app/memory-hierarchy/page.tsx`, 새 `components/ThemeToggle.tsx`

- 현재는 다크 전용. CSS 변수만 토글하면 라이트도 OK (`--color-bg`, `--color-fg` 등).
- 선호 저장은 `localStorage` 하나면 충분 (쿠키 불필요).
- **성공 기준**: 토글 후 새로고침해도 선택이 유지됨.

## #3. `POST /api/feedback` 엔드포인트 완성 ⭐ (Vibe→Agentic 차이를 가장 잘 보여주는 작업)

**파일**: `app/api/feedback/route.ts`, 새 `lib/feedback-store.ts`

- body 검증: `conceptSlug` (string, concepts에 존재), `rating` (1~5 정수), `comment` (string, 선택, ≤200자)
- 메모리 저장 (재시작 시 비워져도 OK). 또는 `.feedback.json`에 append.
- 응답: 성공 시 `{ id, savedAt }`, 검증 실패 시 400 + `AppError` 응답 일관 형식.
- 테스트 1개 추가 (검증 실패 케이스 + 성공 케이스).
- **성공 기준**: 페이지의 피드백 폼에서 전송 → 200 응답 + "전송 완료" 표시.

## #4. `concepts.json`에 새 개념 1개 추가 + 자동 페이지 라우팅

**파일**: `lib/data/concepts.json`, 새 `app/[slug]/page.tsx` 또는 동적 라우트 보강

- 예: "권한 모드 (Permission States)" 추가.
- 정적 페이지 없이도 `/permission-states`가 동작하도록 dynamic route 사용.
- **성공 기준**: 새 slug가 자동으로 홈 카드 + URL 라우팅 둘 다 노출.

## #5. 에러 응답에 `trackingId` (UUID) 포함

**파일**: `app/api/concepts/[slug]/route.ts`, `lib/errors.ts`, `lib/logger.ts`

- 404 응답에 `{ error, trackingId }` 추가.
- 로그에도 같은 trackingId 기록 → grep으로 추적 가능.
- **성공 기준**: 잘못된 slug 호출 시 응답의 trackingId가 콘솔 로그에도 동일하게 나타남.

## #6. 라이브 데이터 컴포넌트에 로딩 스피너 + 에러 재시도 (좀 더 큰 작업)

**파일**: `components/LiveConceptList.tsx`, 새 `components/Spinner.tsx`

- "불러오는 중…" 텍스트 대신 CSS 스피너.
- 실패 시 "다시 시도" 버튼.
- 백오프 retry 3회.
- **성공 기준**: 네트워크 끄고 새로고침했을 때 스피너 → 에러 + 재시도 버튼 흐름 동작.

## #7. axios → fetch 마이그레이션 (도전자용 · Ch03의 50% 룰 직접 해결)

**파일**: `lib/api/axios-client.ts`, `components/FeedbackForm.tsx`, `package.json`

- `lib/api/axios-client.ts`를 fetch 기반으로 재작성.
- `axios` 의존성 제거 (`package.json`에서 삭제).
- 응답 형식·에러 처리는 그대로 유지.
- **성공 기준**: `npm list axios` 출력이 비고, 피드백 폼이 그대로 동작.

---

## 작업 선정 가이드

- **처음 한 사이클**: #1 또는 #5 (가장 작고 명확)
- **Vibe vs Agentic 차이 체감**: #3 (검증·에러 처리·테스트가 모두 필요)
- **Ch03까지 이어 쓸 자료**: #7 (50% 룰 적발 → 실제 해결의 완결 스토리)
