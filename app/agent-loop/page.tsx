import Link from "next/link";
import { LoopDiagram } from "@/components/LoopDiagram";
import { FeedbackForm } from "@/components/FeedbackForm";

export default function AgentLoopPage() {
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
          Concept 1 · 출처: code.claude.com/docs/ko/overview
        </p>
        <h1 className="text-3xl font-bold leading-tight">
          <span className="text-brand-gradient">에이전트 루프</span>
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--color-muted)]">
          Claude Code의 모든 대화는 6단계 순환으로 일어납니다. 한 사이클이 끝나면
          관찰 결과가 다시 다음 사이클의 컨텍스트로 들어가, 점진적으로 목표에
          수렴합니다.
        </p>
      </header>

      <section className="mb-12">
        <LoopDiagram />
      </section>

      <section className="surface mb-8 p-6">
        <h2 className="mb-3 text-lg font-semibold">이 페이지가 도움됐나요?</h2>
        <FeedbackForm slug="agent-loop" />
      </section>

      <section className="surface p-6">
        <h2 className="mb-3 text-lg font-semibold">왜 이 사이클을 알아야 하나?</h2>
        <ul className="space-y-2 text-sm text-[var(--color-muted)]">
          <li>
            <span className="text-[var(--color-fg)]">컨텍스트 수집</span>{" "}
            단계에서 무엇이 들어오느냐가 제안 품질을 좌우합니다 — 이게{" "}
            <code>CLAUDE.md</code>가 중요한 이유입니다.
          </li>
          <li>
            <span className="text-[var(--color-fg)]">권한 요청</span>{" "}
            단계는 사람이 개입할 수 있는 유일한 지점입니다. Plan Mode는 여기서
            계획을 한 번 더 검토합니다.
          </li>
          <li>
            <span className="text-[var(--color-fg)]">결과 관찰</span>{" "}
            단계에서 테스트·로그·에러가 다음 사이클로 들어가야 self-correction
            루프가 닫힙니다. 강의의 "Closed-loop Validation"이 이 부분입니다.
          </li>
        </ul>
      </section>
    </main>
  );
}
