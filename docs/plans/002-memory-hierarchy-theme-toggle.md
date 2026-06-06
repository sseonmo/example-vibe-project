# 002 — `/memory-hierarchy` 페이지 다크/라이트 토글 (TODO #2)

> 계획 문서 컨벤션: `docs/plans/NNN-목적-요약.md` (3자리 순번 + 구현 목적 kebab-case).

## Context

TODO.md #2 실습 작업. 현재 사이트는 다크 전용(`app/globals.css`의 `@theme` 변수 + `color-scheme: dark` 고정). `/memory-hierarchy` 페이지에 다크/라이트 토글 버튼을 추가하고, 선택을 `localStorage`에 저장해 새로고침 후에도 유지되게 한다.

**성공 기준** (TODO.md): 토글 후 새로고침해도 선택이 유지됨.

## 현재 구조

- `app/globals.css` — Tailwind v4 `@theme`에 다크 색상 변수 정의 (`--color-bg`, `--color-bg-elev`, `--color-fg`, `--color-muted`, `--color-border` + 브랜드 2색). `:root { color-scheme: dark }` 고정. 모든 컴포넌트가 `var(--color-*)`를 참조하므로 **변수 오버라이드만으로 라이트 전환 가능** (TODO 힌트 "CSS 변수만 토글하면 라이트도 OK"와 일치).
- `app/layout.tsx` — 서버 컴포넌트. `<html lang="ko">`에 테마 속성과 FOUC 방지 스크립트가 들어갈 자리.
- `app/memory-hierarchy/page.tsx` — 서버 컴포넌트. 상단 nav에 토글 버튼을 배치할 자리.
- 테스트 환경: Vitest + jsdom + `@testing-library/react`(v16)만 설치됨. `@testing-library/jest-dom`·`user-event` 없음 → 기본 단언(`toBeNull()` 등) + `fireEvent` 사용 (001과 동일). 외부 의존성 추가 없음.

## 설계 결정

1. **테마 적용 방식**: `<html data-theme="light">` 속성 토글. `globals.css`에 `:root[data-theme="light"] { ... }` 오버라이드 블록 추가 (라이트 팔레트 + `color-scheme: light`). 기본(속성 없음)은 기존 다크 그대로 → 다른 페이지·기존 동작 회귀 없음. Tailwind v4의 `@theme`는 `:root`에 변수를 내보내므로 `:root[data-theme="light"]`가 특이도에서 이겨 정상 오버라이드됨.
2. **새로고침 유지 (성공 기준)**: `localStorage("theme")` 저장 + **`app/layout.tsx` `<head>`의 인라인 블로킹 스크립트**가 첫 페인트 전에 `localStorage`를 읽어 `data-theme`를 적용 → FOUC(다크→라이트 깜빡임) 방지. 서버는 속성 없이 렌더하므로 `<html>`에 `suppressHydrationWarning` 필요. 스크립트는 `try/catch`로 감싸 `localStorage` 접근 불가 환경(프라이빗 모드 등)에서도 안전하게 다크 기본값으로 동작하고, **저장값이 정확히 `"light"`일 때만 속성을 적용** (그 외 값·손상값은 무시 → 다크 기본):

   ```js
   try {
     if (localStorage.getItem("theme") === "light")
       document.documentElement.dataset.theme = "light";
   } catch (_) {}
   ```

   App Router root layout에서 `<html>` 안에 `<head>` JSX를 직접 렌더하면 Next가 Metadata API 출력(title 등)을 같은 `<head>`에 병합하므로 공존 가능. ESLint `@next/next/no-head-element` 룰은 `app/` 디렉터리 파일을 검사에서 제외하므로 lint도 통과 (룰 소스 확인됨). 만약 빌드/렌더 문제가 확인되면 대안으로 `<body>` 최상단 인라인 `<script>`(파서 블로킹이라 동일하게 FOUC 방지)를 쓴다.

3. **`components/ThemeToggle.tsx`** (신규, `"use client"`):
   - 상태는 마운트 후 `useEffect`에서 `document.documentElement.dataset.theme`로부터 동기화 (인라인 스크립트가 선적용한 값을 신뢰) → hydration 불일치 방지. 라이트 저장 상태에서도 마운트 전 첫 렌더는 다크 가정(🌙·`aria-pressed=false`)으로 그려졌다가 마운트 직후 보정됨 — 한 프레임 이내라 허용하는 의도된 트레이드오프 (페이지 테마 자체는 인라인 스크립트가 이미 적용해 깜빡임 없음).
   - 클릭 시 **`data-theme` 속성을 먼저 변경**하고, `localStorage` 쓰기는 별도 `try/catch`로 감싸 수행 — 저장 실패가 속성 변경을 막지 않게 함 (테스트 5의 전제). 라이트→다크 전환 시 속성은 **제거**(기본=다크 단일 출처 유지), localStorage에는 `"dark"`를 명시 저장.
   - 가시 콘텐츠: 아이콘만 표시(라이트 활성 시 ☀️, 다크 시 🌙 — `aria-hidden` span). 접근 가능한 이름은 **고정** `aria-label="라이트 모드"`.
   - 스타일: `var(--color-border)` 보더 + 패딩으로 버튼 어포던스 확보 (이모지 단독 노출 금지), 호버 시 보더 강조. 터치 타깃 최소 약 40×40px (패딩으로 확보).
   - a11y: `aria-pressed={isLight}` 토글 버튼 패턴. **레이블은 고정하고 pressed 상태만 바꾼다** — `aria-pressed`와 동적 레이블("~로 전환")을 병행하면 스크린 리더에 "눌린 상태"와 "전환 대상"이 뒤섞여 혼란을 주는 안티패턴. 키보드는 네이티브 `<button>`이라 추가 처리 불필요.
4. **버튼 위치**: TODO 명세대로 `/memory-hierarchy` 페이지 상단 nav 우측에 배치 (`flex justify-between`). 테마 자체는 html 속성이라 전역 적용되지만, 토글 진입점은 이 페이지에만 둔다.
5. **라이트 팔레트** (초안 — 수동 검증에서 가독성 확인 후 조정 가능):
   - `--color-bg: #fafafa`, `--color-bg-elev: #ffffff`, `--color-fg: #1a1a24`, `--color-muted: #5b5a6b`, `--color-border: #d8d7e4`. 브랜드 2색(`--color-brand`, `--color-brand-2`)은 기본 공용이되 **예외 1건**: `--color-brand-2`(#06b6d4)는 라이트 배경에서 소형 텍스트 대비가 약 2.5:1로 WCAG AA(4.5:1) 미달 — `HierarchyStack`의 `text-xs` location 텍스트와 `FeedbackForm`의 "전송 완료 ✓"(`text-xs`)가 해당. 라이트 블록에서 `--color-brand-2: #0e7490`(cyan-700, 대비 약 4.9:1)로 오버라이드한다. 부수효과: `.text-brand-gradient`의 시안 끝색도 라이트에서 함께 어두워지는데, 라이트 배경 위 가독성에 오히려 유리하므로 허용. `--color-brand`는 제목 그라데이션(large text, 기준 3:1)과 `FeedbackForm` 버튼 보더(UI 컴포넌트, 기준 3:1 — #a855f7는 약 3.0:1로 경계선상 통과)에 쓰여 공용 유지.
6. **건드리지 않는 것**: `.surface`의 rgba 그라데이션, `HierarchyStack.tsx`의 인라인 rgba 보더 — "CSS 변수만 토글하면 OK"라는 TODO 의도대로 변수 외 하드코딩 색상은 그대로 둠. 라이트에서 다소 옅게 보여도 허용 (수동 검증에서 가독성만 확인).

## 구현 계획 (TDD)

### 1단계 — Red: 테스트 먼저 작성

새 파일 `tests/theme-toggle.test.tsx` (5건). 각 테스트 전 `localStorage.clear()` + `delete document.documentElement.dataset.theme`로 격리:

1. 렌더 시 토글 버튼 존재 (`getByRole("button")`).
2. 클릭 → `document.documentElement.dataset.theme === "light"` + `localStorage.getItem("theme") === "light"`.
3. 재클릭 → 다크 복귀: `data-theme` 속성 제거 + `localStorage.getItem("theme") === "dark"`.
4. `localStorage`에 `"light"`가 있고 html에 `data-theme="light"`가 선적용된 상태(인라인 스크립트 효과 시뮬레이션)로 마운트 → 버튼 `aria-pressed === "true"`.
5. `localStorage` 접근이 예외를 던지는 환경(`vi.spyOn(Storage.prototype, "setItem")` 등으로 throw 시뮬레이션)에서도 크래시 없이 렌더되고 클릭 시 속성 변경은 동작. spy는 `afterEach`의 `vi.restoreAllMocks()`로 복원해 다른 테스트 오염 방지.

`npm test`로 실패(Red) 확인. ※ `layout.tsx`의 인라인 스크립트는 jsdom에서 실행되지 않으므로 "새로고침 유지"는 3단계 수동 검증으로 이관.

### 2단계 — Green: 구현

- `app/globals.css`: `:root[data-theme="light"]` 오버라이드 블록 추가 (위 라이트 팔레트 + `color-scheme: light`). **`@theme` 블록 바깥의 일반 CSS 규칙**으로 작성 — `@theme` 내부에는 셀렉터를 둘 수 없음.
- `components/ThemeToggle.tsx`: 신규 (위 설계 결정 3 참조).
- `app/layout.tsx`: `<head>`에 인라인 블로킹 스크립트(`dangerouslySetInnerHTML`) + `<html suppressHydrationWarning>`.
- `app/memory-hierarchy/page.tsx`: nav를 `flex justify-between`으로 바꾸고 `<ThemeToggle />` 배치.

`npm test`로 통과(Green) 확인.

### 3단계 — 검증

- `npm test` 전체 통과 (기존 `concepts.test.ts`, `errors.test.ts`, `loop-diagram.test.tsx` 회귀 없음)
- `npm run typecheck`, `npm run lint`
- `npm run dev` → `http://localhost:3000/memory-hierarchy`에서 실제 확인:
  - 토글 클릭 시 라이트/다크 전환
  - **새로고침 후 선택 유지 (성공 기준)** + 첫 로드 시 다크→라이트 깜빡임(FOUC) 없음
  - 라이트 모드에서 텍스트·보더 가독성 (특히 `.surface` 카드, muted 텍스트, `HierarchyStack`의 brand-2 location 텍스트)
  - 다른 페이지(`/`, `/agent-loop`)는 localStorage 미설정 시 기본 다크 유지
  - 라이트 저장 상태에서 다른 페이지(`/`, `/agent-loop`)도 라이트로 보이는지 (테마 전역 적용 의도 확인) — 특히 `/agent-loop` 다이어그램의 하드코딩 색(노드 stroke, 툴팁 `--color-bg-elev` 배경)이 라이트에서 깨지지 않는지 훑어 확인
  - 키보드(Tab → Enter/Space)로 토글 동작 + 포커스 링 가시성

## 변경 파일

| 파일                                              | 변경                                                       |
| ------------------------------------------------- | ---------------------------------------------------------- |
| `docs/plans/002-memory-hierarchy-theme-toggle.md` | 신규 — 이 계획 문서                                        |
| `components/ThemeToggle.tsx`                      | 신규 — 토글 버튼 클라이언트 컴포넌트                       |
| `app/globals.css`                                 | 수정 — 라이트 테마 변수 오버라이드 블록                    |
| `app/layout.tsx`                                  | 수정 — FOUC 방지 인라인 스크립트, suppressHydrationWarning |
| `app/memory-hierarchy/page.tsx`                   | 수정 — nav에 ThemeToggle 배치                              |
| `tests/theme-toggle.test.tsx`                     | 신규 — 토글 동작 테스트 5건                                |
| `TODO.md`                                         | 수정 — 구현 완료 후 #2 체크박스 갱신                       |

코드 파일 4개(신규 1 + 수정 3) — TODO 명세가 지목한 3개 + `globals.css`(명세 본문 "CSS 변수만 토글하면"에 암시됨)로, "1~3개 원칙"을 1개 초과하지만 명세 자체가 요구하는 최소 구성. 외부 의존성 추가 0개.

## 주의

- IDEAS/CLAUDE.md의 "의도적으로 혼재된 패턴"(fetch/axios, logger/console)은 건드리지 않음.
- main 직접 커밋 차단 훅이 있으므로 커밋은 별도 브랜치에서 진행 (커밋 요청 시). worktree 정리로 인한 미커밋 손실 위험이 있으므로 구현 시 조기 커밋.

## 알려진 한계 / 스코프 외

- 시스템 선호(`prefers-color-scheme`) 연동은 TODO 범위 밖 — localStorage 미설정 시 무조건 다크 기본. 필요 시 후속 작업.
- 토글 버튼은 `/memory-hierarchy`에만 있으므로 다른 페이지에서는 테마를 바꿀 수 없음 (테마 자체는 전역 적용). TODO 명세 그대로의 의도된 제약.
- 멀티탭 동기화(`storage` 이벤트 수신) 없음 — 다른 탭에서 토글해도 현재 탭은 새로고침 전까지 기존 테마 유지. 실습 범위 밖.
- 향후 strict CSP(`script-src`에 `unsafe-inline` 불허)를 도입하면 인라인 FOUC 방지 스크립트가 차단됨 — 그때는 nonce 부여 또는 외부 스크립트 파일로 전환 필요. 현재 프로젝트는 CSP 미설정이라 영향 없음.
- JS 비활성 환경에서는 토글이 동작하지 않고 다크 기본으로 표시됨 (버튼은 보이되 무반응). 정적 사이트 특성상 허용.
