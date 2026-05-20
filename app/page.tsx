import { Card } from "@/components/Card";
import { LiveConceptList } from "@/components/LiveConceptList";

export default function Home() {
  return (
    <main>
      <header className="mb-12">
        <p className="mb-2 text-sm uppercase tracking-widest text-[var(--color-muted)]">
          example-vibe-project
        </p>
        <h1 className="mb-4 text-4xl font-bold leading-tight">
          <span className="text-brand-gradient">Claude Code 핵심 개념</span>
          <br />한국어 학습자를 위한 시각 자료
        </h1>
        <p className="max-w-2xl text-[var(--color-muted)]">
          이 프로젝트는 강의 실습용 더미 repo입니다. Claude Code 공식 문서의
          핵심 개념을 한국어로 시각화한 페이지와, 학습자가 직접 완성할 미완성
          기능을 포함합니다. <code className="font-mono">IDEAS.md</code>에서
          작업 후보를 고르세요.
        </p>
      </header>

      <section className="grid gap-5 sm:grid-cols-2">
        <Card
          href="/agent-loop"
          badge="Concept 1"
          title="에이전트 루프"
          description="프롬프트 → 분석 → 제안 → 권한 → 실행 → 결과의 순환 사이클을 한눈에."
        />
        <Card
          href="/memory-hierarchy"
          badge="Concept 2"
          title="CLAUDE.md 메모리 계층"
          description="관리 정책 / 사용자 / 프로젝트 / 로컬 4단으로 중첩되는 지침 로드 구조."
        />
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-semibold">라이브 데이터</h2>
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          <code>/api/concepts</code>에서 현재 노출되는 개념 목록. 새 개념을
          추가하면 자동으로 여기 나타납니다 (IDEAS.md #4).
        </p>
        <LiveConceptList />
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-semibold">학습 흐름</h2>
        <ol className="space-y-2 text-sm text-[var(--color-muted)]">
          <li>
            <span className="text-[var(--color-fg)]">1.</span> 이 repo를
            fork → clone → <code>npm install</code> → <code>npm run dev</code>
          </li>
          <li>
            <span className="text-[var(--color-fg)]">2.</span> <code>CLAUDE.md</code>를
            손수 작성 (Part 1 Ch01 실습 1)
          </li>
          <li>
            <span className="text-[var(--color-fg)]">3.</span> <code>IDEAS.md</code>에서
            하나 골라 Plan → Worktree → Verify 사이클 (Part 1 Ch01 통합 실습)
          </li>
        </ol>
      </section>

      <footer className="mt-16 border-t border-[var(--color-border)] pt-6 text-xs text-[var(--color-muted)]">
        출처: code.claude.com/docs/ko · 학습자용 시각 자료는 원문의 핵심을
        요약·재해석한 것입니다.
      </footer>
    </main>
  );
}
