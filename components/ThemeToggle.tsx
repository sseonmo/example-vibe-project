"use client";

import { useEffect, useState } from "react";

/**
 * 다크/라이트 테마 토글 버튼 (docs/plans/002).
 *
 * - 테마는 <html data-theme="light"> 속성으로 적용 (기본=다크, 속성 없음).
 * - 상태는 마운트 후 layout.tsx의 인라인 스크립트가 선적용한 속성에서 동기화
 *   → hydration 불일치 방지. 마운트 전 한 프레임은 다크 가정 (의도된 트레이드오프).
 * - 클릭 시 속성을 먼저 바꾸고, localStorage 저장은 별도 try/catch
 *   → 저장 실패(프라이빗 모드 등)가 토글 자체를 막지 않음.
 */
export function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    setIsLight(document.documentElement.dataset.theme === "light");
  }, []);

  const toggle = () => {
    const next = !isLight;

    // 1) 속성 변경이 먼저 — 저장 실패와 무관하게 테마는 즉시 전환
    if (next) {
      document.documentElement.dataset.theme = "light";
    } else {
      // 다크는 기본값이므로 속성 제거 (단일 출처 유지)
      delete document.documentElement.dataset.theme;
    }
    setIsLight(next);

    // 2) 선호 저장 — 실패해도 무시 (다음 방문 시 다크 기본으로 동작)
    try {
      localStorage.setItem("theme", next ? "light" : "dark");
    } catch {
      // localStorage 접근 불가 환경: 저장만 건너뜀
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="라이트 모드"
      aria-pressed={isLight}
      className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-base leading-none transition-colors hover:border-[var(--color-brand)]"
    >
      <span aria-hidden>{isLight ? "☀️" : "🌙"}</span>
    </button>
  );
}
