import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LoopDiagram } from "@/components/LoopDiagram";

// 노드는 각 <g>의 aria-label(단계 label)로 선택한다 (계획 001 참고)
const NODE_LABELS = [
  "1. 프롬프트",
  "2. 컨텍스트 수집",
  "3. 변경 제안",
  "4. 권한 요청",
  "5. 실행",
  "6. 결과 관찰",
];

describe("LoopDiagram 단계별 툴팁", () => {
  it("렌더 직후에는 툴팁이 없다", () => {
    render(<LoopDiagram />);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("마우스 호버 시 툴팁이 보이고 mouseOut 시 사라진다", () => {
    render(<LoopDiagram />);
    const node = screen.getByLabelText("1. 프롬프트");

    fireEvent.mouseOver(node);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).not.toBeNull();
    // 제목(label) + 목록의 detail보다 자세한 description 본문 포함
    expect(tooltip.textContent).toContain("1. 프롬프트");
    expect(tooltip.textContent).toContain("시작 단계");

    fireEvent.mouseOut(node);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("키보드 포커스 시 툴팁이 보이고 blur 시 사라진다", () => {
    render(<LoopDiagram />);
    const node = screen.getByLabelText("2. 컨텍스트 수집");

    fireEvent.focus(node);
    expect(screen.queryByRole("tooltip")).not.toBeNull();

    fireEvent.blur(node);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("호버로 연 툴팁이 document 레벨 ESC로 닫힌다 (WCAG 1.4.13)", () => {
    render(<LoopDiagram />);
    fireEvent.mouseOver(screen.getByLabelText("1. 프롬프트"));
    expect(screen.queryByRole("tooltip")).not.toBeNull();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("포커스로 연 툴팁이 document 레벨 ESC로 닫힌다", () => {
    render(<LoopDiagram />);
    fireEvent.focus(screen.getByLabelText("3. 변경 제안"));
    expect(screen.queryByRole("tooltip")).not.toBeNull();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("모든 노드가 tabIndex=0이고, 포커스 시에만 aria-describedby로 툴팁과 연결된다", () => {
    render(<LoopDiagram />);

    for (const label of NODE_LABELS) {
      const node = screen.getByLabelText(label);
      expect(node.getAttribute("tabindex")).toBe("0");
    }

    const node = screen.getByLabelText("1. 프롬프트");
    // 비활성 시에는 존재하지 않는 id를 가리키지 않도록 속성 자체가 없어야 한다
    expect(node.getAttribute("aria-describedby")).toBeNull();

    fireEvent.focus(node);
    expect(node.getAttribute("aria-describedby")).toBe("loop-tooltip");
    expect(screen.getByRole("tooltip").id).toBe("loop-tooltip");
  });

  it("클릭(터치 안전망)으로 툴팁이 열린다", () => {
    render(<LoopDiagram />);
    fireEvent.click(screen.getByLabelText("5. 실행"));
    expect(screen.queryByRole("tooltip")).not.toBeNull();
  });

  it("열린 상태에서 다이어그램 바깥 클릭 시 닫힌다", () => {
    render(<LoopDiagram />);
    fireEvent.mouseOver(screen.getByLabelText("6. 결과 관찰"));
    expect(screen.queryByRole("tooltip")).not.toBeNull();

    fireEvent.click(document.body);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});
