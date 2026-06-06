# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 절대 규칙

1. **계획 없이 절대 구현하지 않는다.** 구현 전에 반드시 계획(Plan)을 먼저 세우고 사용자 승인을 받은 뒤 코드를 작성한다. 계획 문서는 `docs/plans/NNN-목적-요약.md` 형식(3자리 순번 + 목적 kebab-case)으로 저장소에 생성한다 (`/plan-doc` 스킬 사용). 단, **계획 문서는 코드 구현 작업에만 필요** — 스킬·훅·설정·문서 등 비구현 작업은 사용자 동의만 받고 진행하며 계획 문서를 만들지 않는다.
2. **계획 승인은 구현 허가가 아니다.** 계획이 승인되어도 곧바로 코드를 작성하지 않는다. 구현 착수 전에 반드시 "구현을 진행할까요?"를 별도로 물어보고 명시적 답을 받은 뒤에만 시작한다.
3. **모든 코드는 TDD로 작성한다.** 테스트를 먼저 작성하고 실패를 확인한 뒤(Red), 통과하는 구현을 작성하고(Green), 테스트로 검증한다.
4. **실제 실행으로 확인하기 전에 "동작한다"고 보고하지 않는다.** 테스트나 dev 서버로 직접 검증하지 않은 것은 추정으로만 말한다.
5. **요청받지 않은 파일은 수정하지 않는다.** 특히 아래 "의도적으로 혼재된 패턴"은 강의 자료이므로 지나가며 정리하지 말 것.

> 검증(typecheck/test/lint), 의존성 추가 차단, main 직접 커밋 차단은 훅/permissions로 강제한다 (`.claude/settings.json`).

## 프로젝트 개요

강의 "실리콘밸리 엔지니어의 Claude Code" Part 1 Ch01·Ch03 실습용 더미 프로젝트(`example-vibe-project`). Claude Code 핵심 개념을 한국어로 시각화한 페이지 2개(`/agent-loop`, `/memory-hierarchy`)와 학습자가 직접 완성할 미완성 기능을 담고 있다. 실습 후보 작업 목록은 `IDEAS.md` 참고.

스택: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + Vitest.

## 명령어

```bash
npm run dev         # 개발 서버 (http://localhost:3000)
npm run build       # 프로덕션 빌드
npm run lint        # ESLint (next lint)
npm run typecheck   # tsc --noEmit
npm test            # vitest 1회 실행
npm run test:watch  # vitest watch
npm run format      # prettier 적용
```

단일 테스트 파일 실행: `npx vitest run tests/concepts.test.ts`

테스트 환경은 jsdom, `globals: true` (vitest.config.ts). 경로 별칭 `@`는 repo 루트를 가리킨다 (tsconfig + vitest 양쪽 설정).

## 아키텍처

데이터 흐름: `lib/data/concepts.json` (정적 데이터 원본) → `lib/concepts.ts` (`listConcepts`/`findConcept`) → `app/api/concepts/` API 라우트 → 클라이언트 컴포넌트(`components/LiveConceptList.tsx` 등)가 `lib/api/` 클라이언트로 호출.

- `app/api/feedback/route.ts`는 **의도적 미완성 stub** (501 반환) — IDEAS.md #3 실습 대상. 요청 없이 완성하지 말 것.
- `lib/errors.ts`의 `AppError`는 `status`/`code`를 가진 일관 에러 응답용 클래스.
- `lib/logger.ts`는 JSON 라인 구조화 로거 (`{ module, event, ... }` payload).
- Next.js 15 동적 라우트: `params`가 Promise이므로 `await params` 필요 (`app/api/concepts/[slug]/route.ts` 참고).

## ⚠️ 의도적으로 혼재된 패턴 — 임의로 "정리"하지 말 것

아래 불일치는 Ch03 실습(`.agent-rules.md` 적발용 50% 룰 자료)을 위해 **일부러** 심어둔 것이다. 명시적으로 요청받지 않는 한 통일/리팩터링하지 말 것:

- HTTP 호출: `fetch` (`lib/api/fetch-client.ts`)와 `axios` (`lib/api/axios-client.ts`) 공존
- 로깅: `logger.info` (`app/api/concepts/route.ts`)와 raw `console.log` (`app/api/concepts/[slug]/route.ts`) 공존
- 에러 처리: `AppError` 정의는 있으나 일부 코드는 `throw new Error()` 사용

## 작업 원칙

- 실습 작업(IDEAS.md)은 변경 파일 1~3개, 외부 의존성 추가 없거나 1개 이하가 원칙.
- UI 텍스트·주석·문서는 한국어로 작성 (기존 코드 컨벤션).
- 커밋은 작업 단위로 작게, 커밋 메시지는 한국어로 작성 (예: `initial commit: 강의 더미 프로젝트 골격`).
