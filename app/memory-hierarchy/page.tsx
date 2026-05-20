import Link from "next/link";
import { HierarchyStack } from "@/components/HierarchyStack";

export default function MemoryHierarchyPage() {
  return (
    <main>
      <nav className="mb-8">
        <Link
          href="/"
          className="text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)]"
        >
          ← 홈으로
        </Link>
      </nav>

      <header className="mb-10">
        <p className="mb-2 text-xs uppercase tracking-widest text-[var(--color-muted)]">
          Concept 2 · 출처: code.claude.com/docs/ko/memory
        </p>
        <h1 className="text-3xl font-bold leading-tight">
          <span className="text-brand-gradient">CLAUDE.md 메모리 계층</span>
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--color-muted)]">
          Claude Code는 매 세션마다 4개 위치의 <code>CLAUDE.md</code>를{" "}
          <span className="text-[var(--color-fg)]">중첩해서</span> 로드합니다.
          가장 넓은 범위(관리 정책)부터 가장 좁은 범위(로컬)까지, 안쪽이 바깥쪽을
          보강·재정의합니다.
        </p>
      </header>

      <section className="mb-12">
        <HierarchyStack />
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <div className="surface p-6">
          <h2 className="mb-3 text-lg font-semibold">두 메모리 시스템</h2>
          <p className="text-sm text-[var(--color-muted)]">
            <code>CLAUDE.md</code>는 <span className="text-[var(--color-fg)]">사람</span>이
            쓰고, 자동 메모리(memory tool)는 <span className="text-[var(--color-fg)]">Claude</span>가
            대화 중 학습한 사실을 씁니다. 둘은 서로 보완하며, 같은 정보를
            중복해서 넣지 않는 게 핵심.
          </p>
        </div>
        <div className="surface p-6">
          <h2 className="mb-3 text-lg font-semibold">우선순위</h2>
          <p className="text-sm text-[var(--color-muted)]">
            동일한 규칙이 여러 계층에 있으면 더 좁은 범위가 이깁니다 (로컬 &gt;
            프로젝트 &gt; 사용자 &gt; 관리 정책). 단{" "}
            <span className="text-[var(--color-fg)]">관리 정책의 강제 규칙</span>은
            덮어쓸 수 없는 경우가 있습니다.
          </p>
        </div>
      </section>
    </main>
  );
}
