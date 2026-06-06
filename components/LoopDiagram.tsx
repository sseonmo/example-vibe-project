"use client";

import { useEffect, useRef, useState } from "react";

type Step = {
  label: string;
  detail: string;
  description: string;
};

const STEPS: Step[] = [
  {
    label: "1. 프롬프트",
    detail: "사용자가 자연어로 의도 전달",
    description:
      "사용자가 자연어로 의도를 전달하는 시작 단계입니다. 목표와 제약이 구체적일수록 이후 루프의 품질이 올라갑니다.",
  },
  {
    label: "2. 컨텍스트 수집",
    detail: "CLAUDE.md · 파일 · 도구 출력 읽기",
    description:
      "CLAUDE.md, 관련 파일, 이전 도구 출력을 읽어 작업에 필요한 맥락을 모읍니다. 맥락이 부족하면 추가 탐색을 반복합니다.",
  },
  {
    label: "3. 변경 제안",
    detail: "diff 또는 명령 형태로 제시",
    description:
      "수집한 맥락을 바탕으로 코드 diff나 실행할 명령을 구체적인 형태로 제시합니다.",
  },
  {
    label: "4. 권한 요청",
    detail: "Allow / Ask / Deny 정책에 따라",
    description:
      "Allow / Ask / Deny 권한 정책에 따라 사용자의 승인을 받습니다. 위험한 작업일수록 명시적 확인을 거칩니다.",
  },
  {
    label: "5. 실행",
    detail: "도구 호출 또는 파일 쓰기",
    description: "승인된 도구 호출이나 파일 쓰기를 실제로 수행합니다.",
  },
  {
    label: "6. 결과 관찰",
    detail: "에러·테스트·로그를 다시 컨텍스트로",
    description:
      "실행 결과로 나온 에러·테스트·로그를 다시 컨텍스트로 흡수해 다음 반복의 입력으로 삼습니다.",
  },
];

export function LoopDiagram() {
  const radius = 150;
  const cx = 200;
  const cy = 200;

  const [activeStep, setActiveStep] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ESC·바깥 클릭 닫기 — 호버로 연 경우 포커스가 노드에 없으므로
  // document 레벨에서 받아야 한다 (WCAG 1.4.13)
  useEffect(() => {
    if (activeStep === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveStep(null);
    };
    const onClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setActiveStep(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onClick);
    };
  }, [activeStep]);

  // blur/mouseLeave는 자신이 연 단계와 일치할 때만 닫는다 (상태 충돌 방지)
  const closeIfActive = (i: number) =>
    setActiveStep((prev) => (prev === i ? null : prev));

  // Math.cos/sin은 JS 엔진(서버 Node ↔ 브라우저)마다 마지막 자리가 달라질 수 있어
  // hydration 불일치를 일으키므로 좌표를 소수점 2자리로 고정한다
  const round2 = (n: number) => Math.round(n * 100) / 100;

  const positions = STEPS.map((_, i) => {
    const angle = (i / STEPS.length) * Math.PI * 2 - Math.PI / 2;
    return {
      x: round2(cx + Math.cos(angle) * radius),
      y: round2(cy + Math.sin(angle) * radius),
    };
  });

  const active =
    activeStep !== null
      ? { step: STEPS[activeStep], pos: positions[activeStep] }
      : null;

  // 가장자리 노드가 컨테이너 밖으로 넘치지 않도록 노드 위치별 펼침 방향 결정
  const tooltipTransform = active
    ? [
        Math.abs(active.pos.x - cx) < 1
          ? "-50%" // 상·하단 중앙 노드는 가로 중앙 정렬
          : active.pos.x < cx
            ? "16px" // 좌측 노드 → 오른쪽으로 펼침
            : "calc(-100% - 16px)", // 우측 노드 → 왼쪽으로 펼침
        active.pos.y < cy ? "16px" : "calc(-100% - 16px)", // 상단 → 아래, 하단 → 위
      ]
    : null;

  return (
    <div className="grid items-center gap-10 md:grid-cols-[400px_1fr]">
      <div ref={wrapperRef} className="relative mx-auto w-full max-w-[400px]">
        <svg
          viewBox="0 0 400 400"
          className="w-full"
          role="group"
          aria-label="에이전트 루프 다이어그램"
        >
          <defs>
            <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.7" />
            </linearGradient>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4" />
            </marker>
          </defs>
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="url(#ring)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          {positions.map((p, i) => {
            const next = positions[(i + 1) % positions.length];
            const midAngle =
              ((i + 0.5) / STEPS.length) * Math.PI * 2 - Math.PI / 2;
            const arcRadius = radius;
            const sx = round2(cx + Math.cos(midAngle - 0.3) * arcRadius);
            const sy = round2(cy + Math.sin(midAngle - 0.3) * arcRadius);
            const ex = round2(cx + Math.cos(midAngle + 0.3) * arcRadius);
            const ey = round2(cy + Math.sin(midAngle + 0.3) * arcRadius);
            return (
              <path
                key={`arc-${i}`}
                d={`M ${sx} ${sy} A ${arcRadius} ${arcRadius} 0 0 1 ${ex} ${ey}`}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1.5"
                markerEnd="url(#arrow)"
                opacity="0.7"
                style={{
                  ...(next ? {} : {}),
                }}
              />
            );
          })}
          {positions.map((p, i) => (
            <g
              key={`node-${i}`}
              tabIndex={0}
              aria-label={STEPS[i].label}
              aria-describedby={activeStep === i ? "loop-tooltip" : undefined}
              className="group cursor-pointer outline-none"
              onMouseEnter={() => setActiveStep(i)}
              onMouseLeave={() => closeIfActive(i)}
              onFocus={() => setActiveStep(i)}
              onBlur={() => closeIfActive(i)}
              // 터치/Safari 안전망 — 열기 전용·멱등 (토글이면 호버로 연 상태를 클릭이 닫음)
              onClick={() => setActiveStep(i)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r="28"
                fill="#11111a"
                stroke={activeStep === i ? "#06b6d4" : "#a855f7"}
                strokeWidth={activeStep === i ? 3 : 1.5}
                // ESC로 닫은 뒤에도 포커스가 남아 있으면 링 유지 (WCAG 2.4.7)
                className="group-focus-visible:stroke-[#06b6d4] group-focus-visible:[stroke-width:3]"
              />
              <text
                x={p.x}
                y={p.y + 4}
                textAnchor="middle"
                fill="#e7e7f0"
                fontSize="13"
                fontWeight="600"
              >
                {i + 1}
              </text>
            </g>
          ))}
          <text
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            fill="#9897a8"
            fontSize="11"
          >
            Agent Loop
          </text>
          <text
            x={cx}
            y={cy + 12}
            textAnchor="middle"
            fill="#e7e7f0"
            fontSize="14"
            fontWeight="600"
          >
            반복 사이클
          </text>
        </svg>

        {active && tooltipTransform && (
          <div
            role="tooltip"
            id="loop-tooltip"
            className="surface pointer-events-none absolute z-10 w-max max-w-[220px] px-4 py-3"
            style={{
              left: `${(active.pos.x / 400) * 100}%`,
              top: `${(active.pos.y / 400) * 100}%`,
              transform: `translate(${tooltipTransform[0]}, ${tooltipTransform[1]})`,
              // .surface의 background 단축 속성이 배경색을 투명으로 되돌리므로
              // (레이어 밖 CSS > Tailwind 유틸리티) inline으로 불투명 배경을 강제한다
              backgroundColor: "var(--color-bg-elev)",
            }}
          >
            <p className="text-sm font-semibold">{active.step.label}</p>
            <p className="mt-1 text-xs text-[var(--color-fg)]">
              {active.step.description}
            </p>
          </div>
        )}
      </div>

      <ol className="space-y-3">
        {STEPS.map((step) => (
          <li key={step.label} className="surface px-4 py-3">
            <p className="text-sm font-semibold">{step.label}</p>
            <p className="text-xs text-[var(--color-muted)]">{step.detail}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
