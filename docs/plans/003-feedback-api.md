# 003 — `POST /api/feedback` 엔드포인트 완성 (IDEAS #3)

> 계획 문서 컨벤션: `docs/plans/NNN-목적-요약.md` (3자리 순번 + 구현 목적 kebab-case).

## Context

IDEAS.md #3 실습 작업. 현재 `app/api/feedback/route.ts`는 의도적 미완성 stub으로 501을 반환한다. body 검증 + 메모리 저장 + 일관된 에러 응답을 갖춘 실제 엔드포인트로 완성한다.

**요구사항** (IDEAS.md #3):

- body 검증: `conceptSlug` (string, concepts에 존재), `rating` (1~5 정수), `comment` (string, 선택, ≤200자)
- 메모리 저장 (재시작 시 비워져도 OK)
- 성공 시 `{ id, savedAt }`, 검증 실패 시 400 + `AppError` 응답 일관 형식
- 테스트 추가 (검증 실패 케이스 + 성공 케이스)

**성공 기준**: `/agent-loop` 페이지의 피드백 폼에서 전송 → 200 응답 + "전송 완료 ✓" 표시.

## 현재 구조 (실제 확인)

- `app/api/feedback/route.ts` — stub. `await req.text()` 후 무조건 `{ stub: true }` + 501 반환.
- `components/FeedbackForm.tsx` (`/agent-loop` 페이지에서 사용) — `postFeedback({ conceptSlug, rating, comment })` 호출. axios는 비-2xx에 throw하므로 현재 501 → "전송 실패" 표시. **2xx만 반환하면 폼 수정 없이 성공 기준 충족.** rating은 `Number(...)`라 입력이 비면 NaN, comment는 빈 문자열로 항상 전송됨 → 검증이 NaN·빈 문자열을 다뤄야 함.
- `lib/api/axios-client.ts` — `postFeedback`이 `/api/feedback`으로 POST. **수정 불필요** (혼재 패턴 불가침).
- `lib/concepts.ts` — `findConcept(slug)`로 존재 검증 재사용 가능.
- `lib/errors.ts` — `AppError { status, code, message }`. 아직 API 라우트에서 응답으로 변환해 쓰는 선례는 없음 (이번이 첫 사용처 — IDEAS #3이 명시 요구).
- `lib/logger.ts` — `logger.info({ module, event, ... })` JSON 라인 로거 (`app/api/concepts/route.ts` 패턴).
- 테스트: Vitest + jsdom, `globals: true`, 별칭 `@` = repo 루트. Node 20+ 환경이라 `Request`/`crypto.randomUUID` 전역 사용 가능.

## 설계 결정

1. **저장 방식**: `lib/feedback-store.ts`에 **모듈 레벨 in-memory 배열** (IDEAS가 명시 허용 — 재시작 시 소실 OK). `.feedback.json` append 방식은 동시성·직렬화 처리가 더 필요하므로 채택하지 않음.
   - `saveFeedback(input): FeedbackEntry` — `id: crypto.randomUUID()`, `savedAt: new Date().toISOString()` 부여 후 push, 엔트리 반환. route는 body 객체를 통째로 넘기지 않고 **명시적 필드 픽** `{ conceptSlug, rating, comment }`로 전달 — unknown 필드가 메모리에 적재되지 않게 함 ("unknown 필드 무시"의 실제 구현 지점).
   - `listFeedback(): FeedbackEntry[]`, `clearFeedback(): void` — 테스트 격리용 (각 테스트 전 `clearFeedback()`).
2. **검증 위치·방식**: 외부 라이브러리(zod 등) 없이 route 핸들러 안에서 수동 검증 (외부 의존성 0 원칙). 에러는 실제 시그니처대로 `new AppError(message, { status: 400, code })` 형태로 생성 (`lib/errors.ts:5` — message-first + options 객체):
   - JSON 파싱 실패 → `code: "invalid_json"`. **메커니즘 명시**: `req.json()`을 별도(중첩) try로 감싸 SyntaxError를 `AppError`로 rethrow — 단일 try로 구현하면 파싱 에러가 비-AppError 분기로 빠져 500이 되는 함정 방지.
   - **non-object body 가드**: 파싱은 성공하지만 객체가 아닌 body(`null`·배열·문자열·숫자 — 예: `curl -d 'null'`)는 destructure 시 TypeError → 500 누출. 파싱 직후 `typeof body !== "object" || body === null || Array.isArray(body)`면 400 `"invalid_json"` 처리.
   - `conceptSlug`: string 타입 + `findConcept()` 존재 확인 → 실패 시 `"invalid_concept_slug"` / `"unknown_concept_slug"`
   - `rating`: `Number.isInteger(rating) && 1 <= rating <= 5` → 실패 시 `"invalid_rating"` (NaN·소수·범위 밖 모두 거름)
   - `comment`: `undefined` 허용, 있으면 string + 길이 ≤200 → 실패 시 `"invalid_comment"`. 빈 문자열은 유효 (폼이 항상 빈 문자열을 보냄).
   - **검증 순서 = 위 나열 순서** (가드 → slug → rating → comment). 테스트 케이스 8(slug 누락 + 다른 필드 유효)이 이 순서를 전제하므로 구현 시 순서 준수.
3. **에러 응답 일관 형식**: 검증 실패 시 `AppError`를 throw하고 핸들러의 `try/catch`에서 `NextResponse.json({ error: err.code, message: err.message }, { status: err.status })`로 변환. `AppError`가 아닌 예외는 500 + `internal_error` — 이때 `message`는 **고정 문자열**(예: `"내부 오류"`)로 응답해 내부 예외 메시지·스택 정보를 클라이언트에 노출하지 않는다 (상세는 서버 로그에만). 변환 헬퍼는 route 파일 내부 함수로 둠 — `lib/errors.ts`는 수정하지 않음 (변경 파일 최소화 + 혼재 패턴 자료 보존).
4. **성공 응답**: `{ id, savedAt }` + **200** (IDEAS 성공 기준이 "200 응답"을 명시하므로 201 대신 200).
5. **로깅**: 인접 라우트인 `app/api/concepts/route.ts`의 `logger.info` 패턴을 따라 저장 성공 시 `logger.info({ module: "feedback", event: "saved", id, conceptSlug })` 1줄. **실패 경로도 무로그로 두지 않는다** — catch 블록에서 `AppError`면 `logger.warn({ module: "feedback", event: "rejected", code })`, 그 외 예외면 `logger.error({ module: "feedback", event: "error" })`를 남겨 모든 실패를 서버 로그에서 가시화한다. (`[slug]` 라우트의 raw console.log 패턴은 혼재 자료이므로 모방하지 않고, 같은 디렉터리 계열의 logger 패턴 채택.)
6. **FeedbackForm 미수정**: 폼의 실패 문구("아직 stub입니다")가 구현 후 사실과 어긋나지만, IDEAS #3 파일 범위 밖이고 "요청받지 않은 파일 수정 금지" 규칙에 따라 건드리지 않음 (스코프 외 항목에 기재).

## 구현 계획 (TDD)

### 1단계 — Red: 테스트 먼저 작성

새 파일 `tests/feedback.test.ts`. **파일 최상단에 `/** @vitest-environment node \*/`docblock 명시** (vitest 공식 표기) — vitest 전역 환경이 jsdom인데 route handler 테스트 선례가 없어, DOM이 불필요한 이 테스트는 node 환경으로 분리해`Request`/`NextResponse`가용성을 보장한다 (환경 문제로 Red 신호가 오염되는 것을 방지, 설정 파일은 무수정).`POST`를 `@/app/api/feedback/route`에서 직접 import하여 `new Request("http://localhost/api/feedback", { method: "POST", body: JSON.stringify(...) })`로 호출. `beforeEach`에서 `clearFeedback()`으로 격리. 케이스 10건:

1. **성공**: 유효 body(`conceptSlug: "agent-loop"`, `rating: 5`, `comment: "좋아요"`) → 200 + 응답에 `id`(string)·`savedAt`(ISO) 존재 + `listFeedback()`에 1건 저장됨.
2. **성공 — comment 생략/빈 문자열**: comment 없이도 200.
3. **실패 — 존재하지 않는 slug**: `conceptSlug: "does-not-exist"` → 400 + `error: "unknown_concept_slug"`.
4. **실패 — rating 범위 밖**: `rating: 6` → 400 + `error: "invalid_rating"`.
5. **실패 — rating 비정수/null/누락**: `rating: 4.5` → 400, `rating: null` → 400 (폼에서 입력을 비우면 NaN인데 `JSON.stringify`가 NaN을 `null`로 직렬화하므로 서버에 실제 도착하는 값은 `null`), `rating` 필드 누락 → 400 (모두 `Number.isInteger`가 거름).
6. **실패 — comment 201자**: `"가".repeat(201)` → 400 + `error: "invalid_comment"`.
7. **실패 — JSON 아님**: body `"not json"` → 400 + `error: "invalid_json"`.
8. **실패 — conceptSlug 누락/타입 오류**: body에 `conceptSlug` 없음(또는 숫자) → 400 + `error: "invalid_concept_slug"` (`unknown_concept_slug`와 분기가 다르므로 별도 커버).
9. **실패 — JSON이되 객체 아님**: body `"null"` (JSON으로 유효한 `null`) → 400 + `error: "invalid_json"` (가드 없으면 destructure TypeError로 500이 나는 경로 — non-object 가드 검증).
10. **500 경로 — 예상 밖 예외**: `vi.spyOn`으로 `saveFeedback`이 throw하도록 모킹 → 500 + `error: "internal_error"` + 고정 메시지 (비-AppError 분기 검증, `afterEach`에서 `vi.restoreAllMocks()`).

`npm test`로 실패(Red) 확인 — 현재 stub은 모든 케이스에 501을 반환하므로 전부 실패해야 정상.

### 2단계 — Green: 구현

- `lib/feedback-store.ts` (신규): `FeedbackEntry` 타입 + `saveFeedback` / `listFeedback` / `clearFeedback` (설계 결정 1).
- `app/api/feedback/route.ts` (재작성): JSON 파싱 → 필드 검증(`AppError` throw) → `saveFeedback` → `logger.info` → `{ id, savedAt }` 200. `try/catch`에서 `AppError` → 일관 JSON 응답 변환 (설계 결정 2~5).

`npm test`로 통과(Green) 확인.

### 3단계 — 검증

- `npm test` 전체 통과 (기존 4개 테스트 파일 회귀 없음)
- `npm run typecheck`, `npm run lint`
- `npm run dev` → `http://localhost:3000/agent-loop`에서 실제 확인:
  - 피드백 폼 전송 → **"전송 완료 ✓" 표시 (성공 기준)** + 네트워크 탭에서 200 + `{ id, savedAt }` 응답
  - 터미널에 `{"module":"feedback","event":"saved",...}` JSON 로그 1줄
  - `curl`로 검증 실패 직접 확인: `curl -s -X POST localhost:3000/api/feedback -d '{"conceptSlug":"nope","rating":3}'` → 400 + `{ error, message }`

## 변경 파일

| 파일                             | 변경                                                     |
| -------------------------------- | -------------------------------------------------------- |
| `docs/plans/003-feedback-api.md` | 신규 — 이 계획 문서                                      |
| `lib/feedback-store.ts`          | 신규 — in-memory 저장소 (save/list/clear)                |
| `app/api/feedback/route.ts`      | 재작성 — 검증 + 저장 + AppError 일관 응답                |
| `tests/feedback.test.ts`         | 신규 — 성공 2건 + 검증 실패 7건 + 500 경로 1건 (총 10건) |

코드 파일 2개(신규 1 + 재작성 1) + 테스트 1개 — IDEAS #3이 지목한 파일 구성 그대로. **변경 파일 1~3개 원칙 충족, 외부 의존성 추가 0개.**

## 주의

- "의도적으로 혼재된 패턴" 불가침: `lib/api/axios-client.ts`(axios), `app/api/concepts/[slug]/route.ts`(console.log), `lib/errors.ts` 모두 수정하지 않음. `AppError` **사용**은 IDEAS #3의 명시 요구라 혼재 정리에 해당하지 않음.
- `components/FeedbackForm.tsx` 수정하지 않음 (스코프 외 참조).
- main 직접 커밋 차단 훅이 있으므로 커밋은 별도 브랜치에서 진행. worktree 정리로 인한 미커밋 손실 위험이 있으므로 구현 시 조기 커밋.

## 알려진 한계 / 스코프 외

- **저장소 휘발성**: in-memory라 서버 재시작·HMR 리로드 시 데이터 소실 — IDEAS가 명시 허용한 트레이드오프. 영속화가 필요해지면 `.feedback.json` append로 후속 전환 가능.
- **저장소 무한 증가**: 프로세스 생존 동안 배열이 계속 자람 (상한·정리 없음) — 로컬 강의 서버라 허용. rate limit 부재와 함께 실습 범위 밖.
- **FeedbackForm 실패 문구 stale**: 구현 후에도 실패 시 "아직 stub입니다" 문구가 뜸 (실제로는 네트워크/검증 오류). 파일 범위 밖이라 미수정 — 원하면 별도 1줄 수정으로 후속 처리.
- **rate limit·중복 제출 방지 없음**: 같은 사용자가 무한 제출 가능. 실습 범위 밖.
- **unknown 필드 무시**: body에 추가 필드가 있어도 거부하지 않고 무시 (strict 검증은 범위 밖). 저장 시 명시적 필드 픽으로 실제 무시됨 (설계 결정 1).
- **모듈 상태 공유 미보장**: 향후 다른 라우트(예: GET 조회)가 store를 import하면 dev 번들링·prod 멀티 워커에서 모듈 인스턴스가 분리될 수 있음 — 현재는 단일 라우트만 사용하므로 무해, 후속 확장 시 인지 필요.
- **comment 200자 = UTF-16 코드유닛 기준**: `.length`는 이모지·서로게이트 쌍을 2로 셈 — 강의 범위에서 허용.
- **body 크기 제한 없음**: comment 길이 검증은 파싱 후라 거대 JSON 자체는 파싱됨 — rate limit과 함께 실습 범위 밖.
- **`unknown_concept_slug`를 400으로 처리**: 의미상 404/422 논쟁 여지가 있으나 IDEAS가 "검증 실패 시 400"으로 일괄 지정 — 스펙 그대로 따름.

## 셀프 체크리스트

- [x] **범위 적절** — 코드 2 + 테스트 1 (1~3개 원칙 충족), FeedbackForm 등 스코프 외 명시
- [x] **기존 패턴 준수** — `findConcept`·`AppError`·`logger` 재사용, 혼재 패턴 불가침
- [x] **테스트 포함** — TDD 10케이스 명세, dev 서버 확인은 수동 검증으로 이관
- [x] **리스크 명시** — 휘발성·stale 문구·400 일괄 처리 등 한계와 대안 기술

---

## /autoplan 리뷰 기록 (2026-06-06)

> 파이프라인: CEO → Eng (Design/DX는 스코프 미해당으로 건너뜀). Codex CLI 미설치로 듀얼 보이스는 Claude subagent 단독 `[subagent-only]`.
> **최종 게이트: APPROVED** (D2=A). 결정 22건 = 자동 20 · 사용자 승인 2 (D1: 테스트 node 환경 보강, D3: FeedbackForm 문구 TODO 이연). 발견 13건 전건 해소, CRITICAL GAP 0. 교차 페이즈 테마: 에러 경로 완전성 (양 페이즈 독립 지적 → 5건 반영).

### 에러·구조 레지스트리 (CEO Section 2)

| 코드패스       | 실패 원인                              | 처리                          | 사용자가 보는 것 | 로그                        |
| -------------- | -------------------------------------- | ----------------------------- | ---------------- | --------------------------- |
| `req.json()`   | 비-JSON body                           | `AppError` 400 `invalid_json` | 폼 "전송 실패"   | `logger.warn rejected`      |
| body 가드      | JSON이되 객체 아님(null·배열·문자열)   | 400 `invalid_json`            | 폼 "전송 실패"   | `logger.warn rejected`      |
| slug 검증      | 타입 오류/누락                         | 400 `invalid_concept_slug`    | 폼 "전송 실패"   | `logger.warn rejected`      |
| slug 검증      | 미존재 slug                            | 400 `unknown_concept_slug`    | 폼 "전송 실패"   | `logger.warn rejected`      |
| rating 검증    | 비정수·범위 밖·null(폼 NaN→JSON null)  | 400 `invalid_rating`          | 폼 "전송 실패"   | `logger.warn rejected`      |
| comment 검증   | 비-string·201자+                       | 400 `invalid_comment`         | 폼 "전송 실패"   | `logger.warn rejected`      |
| 그 외 예외     | 예상 밖 런타임 오류                    | 500 `internal_error`          | 폼 "전송 실패"   | `logger.error error`        |
| `saveFeedback` | 현실적 실패 경로 없음 (in-memory push) | —                             | —                | 성공 시 `logger.info saved` |

### 실패 모드 레지스트리

| 코드패스    | 실패 모드        | 처리?        | 테스트?                    | 사용자 가시?     | 로그? |
| ----------- | ---------------- | ------------ | -------------------------- | ---------------- | ----- |
| 검증 6종    | 400 거부         | Y            | Y (케이스 3~9)             | Y (폼 에러 표시) | Y     |
| 비-AppError | 500              | Y            | Y (케이스 10 — spyOn 모킹) | Y                | Y     |
| HMR/재시작  | 저장 데이터 소실 | 허용 (IDEAS) | N/A                        | N (의도)         | N/A   |
| 무한 제출   | 배열 무한 증가   | 스코프 외    | N/A                        | N                | N/A   |

**CRITICAL GAP: 0건** (실패 경로 무로그 GAP은 설계 결정 5 보강으로 해소).

### 드림 스테이트 델타

`stub 501` → **이 계획**: 검증+저장+일관 에러 응답+테스트 10건 (TODO 3/3 완료) → **12개월 이상향**: Plan→TDD→Verify 사이클이 완결된 강의 레포 + Ch03 #7(axios→fetch) 자료 보존. 방향 일치, 잔여 델타는 후속 실습 항목뿐.

### 결정 감사 추적 (Decision Audit Trail)

| #   | Phase        | 결정                                                | 분류                  | 원칙  | 근거                                                         | 기각안                    |
| --- | ------------ | --------------------------------------------------- | --------------------- | ----- | ------------------------------------------------------------ | ------------------------- |
| 1   | 0            | UI scope 아니오 → Design 페이즈 건너뜀              | Mechanical            | P3    | view 코드 무변경, form 매칭은 미수정 컴포넌트 참조           | Phase 2 실행              |
| 2   | 0            | DX scope 아니오 → DX 페이즈 건너뜀                  | Mechanical            | P3    | 내부 라우트, 외부 개발자 통합 대상 아님                      | Phase 3.5 실행            |
| 3   | CEO 0C-bis   | 접근 A(in-memory+수동 검증) 채택                    | Mechanical            | P1+P5 | 동일 완전성에서 최소 복잡도·의존성 0                         | B(.feedback.json), C(zod) |
| 4   | CEO 0A       | P4 보강 — 테스트 `// @vitest-environment node` 명시 | **사용자 승인(D1=A)** | —     | jsdom 전역 + route 테스트 선례 0건, Red 신호 오염 방지       | 원안 유지                 |
| 5   | CEO §2(F-2)  | 계획 내 AppError 호출 표기를 실제 시그니처로 정정   | Mechanical            | P5    | lib/errors.ts:5 실사 — message-first + opts                  | 표기 유지                 |
| 6   | CEO §2/§8    | 실패 경로 로깅(warn/error) 계획에 추가              | Mechanical            | P1+P2 | "무로그 실패 금지", blast radius 내 1줄                      | 성공만 로깅               |
| 7   | CEO §6       | 테스트 케이스 8(slug 누락/타입) 추가                | Mechanical            | P1    | invalid/unknown 분기가 달라 별도 커버 필요                   | 7케이스 유지              |
| 8   | CEO §4       | 케이스 5에 `rating: null` 보강                      | Mechanical            | P1    | JSON.stringify가 NaN→null 직렬화, 실제 폼 동작 정합          | 4.5만 테스트              |
| 9   | CEO §1/§7    | 한계에 "저장소 무한 증가" 1줄 추가                  | Mechanical            | P1    | rate limit과 별개의 메모리 측면 명시                         | 미기재                    |
| 10  | CEO 0D       | 확장 후보 GET 조회·trackingId·rate limit 기각       | Mechanical            | P3+P4 | 범위 밖·IDEAS #5 중복·실습 외                                | scope 추가                |
| 11  | CEO §10(F-3) | FeedbackForm stale 문구 1줄 후속 수정               | **사용자 결정(D3=B)** | —     | TODO.md 후속 항목으로 이연 — 이번 스코프는 IDEAS #3 그대로   | 스코프 포함, 무기록 방치  |
| 12  | CEO(F-4)     | 커밋 전 restore-point 주석 제거                     | Mechanical            | P5    | 로컬 경로 잔재는 저장소에 무의미                             | 주석 유지                 |
| 13  | Eng §2(E-1)  | non-object body 가드 + 테스트 케이스 9 추가         | Mechanical            | P1    | `curl -d 'null'` 한 방에 500 누출 — 실행 실증(확신 9/10)     | 가드 없이 진행            |
| 14  | Eng §2(E-2)  | `req.json()` 중첩 try 메커니즘 명세                 | Mechanical            | P5    | 단일 try면 SyntaxError가 500행 — 구현 함정 선제 차단         | 미명세                    |
| 15  | Eng §3(E-3)  | 500 경로 spyOn 모킹 테스트 케이스 10 추가           | Mechanical            | P1    | "수동 curl 검증"은 실현 불가한 허구 — 실측 가능하게 교체     | 레지스트리만 정정         |
| 16  | Eng §4(S-1)  | 500 응답 메시지 고정 문자열 명세                    | Mechanical            | P5    | 내부 예외 메시지 클라이언트 노출 차단                        | 미명세                    |
| 17  | Eng §2(E-4)  | 케이스 5에 rating 누락(undefined) 포함              | Mechanical            | P1    | 같은 분기지만 명세 완결                                      | 미기재                    |
| 18  | Eng §4(S-2)  | store 저장 시 명시적 필드 픽 명세                   | Mechanical            | P5    | body 통째 push면 unknown 필드 적재 — "무시"의 실제 구현 지점 | 미명세                    |
| 19  | Eng §3(T-2)  | 환경 주석을 docblock `/** */` 표기로 정정           | Mechanical            | P3    | vitest 공식 문서 표기                                        | 라인 주석                 |
| 20  | Eng §1·2     | 한계 3줄 추가(모듈 인스턴스·UTF-16 자수·body 크기)  | Mechanical            | P1    | A-2/E-5/S-3 — 후속 확장 시 함정 문서화                       | 미기재                    |
| 21  | Eng §2(E-6)  | 검증 순서 = 나열 순서 명시                          | Mechanical            | P5    | 케이스 8이 순서를 전제                                       | 암묵 순서                 |
