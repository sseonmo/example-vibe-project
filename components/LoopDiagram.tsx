type Step = {
  label: string;
  detail: string;
};

const STEPS: Step[] = [
  { label: "1. 프롬프트", detail: "사용자가 자연어로 의도 전달" },
  { label: "2. 컨텍스트 수집", detail: "CLAUDE.md · 파일 · 도구 출력 읽기" },
  { label: "3. 변경 제안", detail: "diff 또는 명령 형태로 제시" },
  { label: "4. 권한 요청", detail: "Allow / Ask / Deny 정책에 따라" },
  { label: "5. 실행", detail: "도구 호출 또는 파일 쓰기" },
  { label: "6. 결과 관찰", detail: "에러·테스트·로그를 다시 컨텍스트로" },
];

export function LoopDiagram() {
  const radius = 150;
  const cx = 200;
  const cy = 200;

  const positions = STEPS.map((_, i) => {
    const angle = (i / STEPS.length) * Math.PI * 2 - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    };
  });

  return (
    <div className="grid items-center gap-10 md:grid-cols-[400px_1fr]">
      <svg
        viewBox="0 0 400 400"
        className="mx-auto w-full max-w-[400px]"
        role="img"
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
          const sx = cx + Math.cos(midAngle - 0.3) * arcRadius;
          const sy = cy + Math.sin(midAngle - 0.3) * arcRadius;
          const ex = cx + Math.cos(midAngle + 0.3) * arcRadius;
          const ey = cy + Math.sin(midAngle + 0.3) * arcRadius;
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
          <g key={`node-${i}`}>
            <circle
              cx={p.x}
              cy={p.y}
              r="28"
              fill="#11111a"
              stroke="#a855f7"
              strokeWidth="1.5"
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

      <ol className="space-y-3">
        {STEPS.map((step) => (
          <li
            key={step.label}
            className="surface px-4 py-3"
          >
            <p className="text-sm font-semibold">{step.label}</p>
            <p className="text-xs text-[var(--color-muted)]">{step.detail}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
