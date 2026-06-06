import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "@/components/ThemeToggle";

// 각 테스트 전 테마 상태 격리 (계획 002 참고)
beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ThemeToggle 다크/라이트 토글", () => {
  it("렌더 시 토글 버튼이 존재한다", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).not.toBeNull();
  });

  it("클릭 시 라이트로 전환되고 localStorage에 저장된다", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button"));

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("재클릭 시 다크로 복귀한다 — 속성 제거 + 'dark' 명시 저장", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");

    fireEvent.click(button);
    fireEvent.click(button);

    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("라이트가 선적용된 상태(인라인 스크립트 효과)로 마운트하면 aria-pressed가 true다", () => {
    // layout.tsx의 인라인 블로킹 스크립트가 첫 페인트 전에 해둔 일을 시뮬레이션
    localStorage.setItem("theme", "light");
    document.documentElement.dataset.theme = "light";

    render(<ThemeToggle />);
    expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("localStorage 저장이 실패해도 크래시 없이 속성 전환은 동작한다", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });

    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button"));

    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
