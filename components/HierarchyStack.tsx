type Layer = {
  rank: number;
  scope: string;
  location: string;
  author: string;
  detail: string;
};

const LAYERS: Layer[] = [
  {
    rank: 1,
    scope: "관리 정책",
    location: "/etc/claude/CLAUDE.md (또는 enterprise 설정)",
    author: "조직 관리자",
    detail: "팀·회사 단위로 강제되는 규칙. 사용자가 덮어쓸 수 없음.",
  },
  {
    rank: 2,
    scope: "사용자",
    location: "~/.claude/CLAUDE.md",
    author: "본인",
    detail: "모든 프로젝트에서 공통으로 적용할 개인 선호.",
  },
  {
    rank: 3,
    scope: "프로젝트",
    location: "<repo>/CLAUDE.md",
    author: "팀 (git에 commit)",
    detail: "프로젝트 절대 규칙·치트시트·아키텍처·컨벤션·TODO.",
  },
  {
    rank: 4,
    scope: "로컬",
    location: "<repo>/CLAUDE.local.md (.gitignore)",
    author: "본인 (commit X)",
    detail: "내 작업 환경 한정 메모. 동료에게 공유 안 됨.",
  },
];

export function HierarchyStack() {
  return (
    <div className="space-y-3">
      {LAYERS.map((layer) => (
        <div
          key={layer.rank}
          className="surface flex flex-col gap-3 p-5 md:flex-row md:items-center md:gap-6"
          style={{
            marginLeft: `${(layer.rank - 1) * 24}px`,
            marginRight: `${(layer.rank - 1) * 24}px`,
          }}
        >
          <div className="flex shrink-0 items-center gap-3">
            <span
              className="grid h-10 w-10 place-items-center rounded-full font-mono text-sm"
              style={{
                background:
                  "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(6,182,212,0.2))",
                border: "1px solid rgba(168,85,247,0.5)",
              }}
            >
              {layer.rank}
            </span>
            <div>
              <p className="text-base font-semibold">{layer.scope}</p>
              <p className="text-xs text-[var(--color-muted)]">{layer.author}</p>
            </div>
          </div>
          <div className="flex-1">
            <p className="font-mono text-xs text-[var(--color-brand-2)]">
              {layer.location}
            </p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{layer.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
