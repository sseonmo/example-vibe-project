# example-vibe-project

> 강의 **"실리콘밸리 엔지니어의 Claude Code"** Part 1 Ch01·Ch03 실습용 더미 프로젝트.

Claude Code 공식 문서의 핵심 개념을 한국어 학습자가 보기 쉽게 시각화한 페이지 2개와, 학습자가 직접 완성할 미완성 기능을 담고 있습니다.

## 빠른 시작

```bash
git clone https://github.com/jha0313/example-vibe-project.git
cd example-vibe-project
npm install
npm run dev          # http://localhost:3000
```

## 시각 페이지

| URL | 개념 | 출처 |
|---|---|---|
| `/agent-loop` | 에이전트 루프 (6단계 순환) | code.claude.com/docs/ko/overview |
| `/memory-hierarchy` | CLAUDE.md 메모리 계층 (4단) | code.claude.com/docs/ko/memory |

## API

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/concepts` | 개념 목록 |
| GET | `/api/concepts/[slug]` | 개념 상세 |
| POST | `/api/feedback` | 피드백 저장 (**미완성 stub** — IDEAS.md #3) |

## 명령어

```bash
npm run dev         # 개발 서버
npm run build       # 프로덕션 빌드
npm run start       # 프로덕션 서버
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # vitest 1회 실행
npm run test:watch  # vitest watch
npm run format      # prettier 적용
```

## 강의 실습 매핑

- **Part 1 · Ch01** (Claude Code 딥다이브) — 이 repo에 `CLAUDE.md`를 손수 작성, `.claude/settings.json`을 채우고, 통합 실습으로 `IDEAS.md`에서 하나 골라 Plan → Worktree → Verify 사이클.
- **Part 1 · Ch03** (Agentic Engineering) — 본인이 Ch02에서 만든 vibe-90min repo가 1순위지만, 더 실전에 가까운 경험을 원하면 이 repo도 가능. 의도적으로 심어둔 경쟁 패턴(50% 룰 자료)이 `.agent-rules.md` 적발의 좋은 소재.

## 의도적 "약점" — 50% 룰 자료

학습자가 Ch03에서 `.agent-rules.md`에 적발할 수 있도록 몇몇 패턴이 **일부러 혼재**되어 있습니다:

- HTTP 호출: `fetch` (`lib/api/fetch-client.ts`)와 `axios` (`lib/api/axios-client.ts`)가 공존
- 로깅: `logger.info` (`app/api/concepts/route.ts`)와 raw `console.log` (`app/api/concepts/[slug]/route.ts`)가 공존
- 에러 처리: `AppError` 클래스 정의(`lib/errors.ts`)는 있지만 일부는 `throw new Error()` 사용

Ch03에서 한 쪽을 DEPRECATED로 표시하고 점진 마이그레이션 룰을 적어보세요.

## 라이선스

학습 목적. 제한 없이 fork·수정 가능.
