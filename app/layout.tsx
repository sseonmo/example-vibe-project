import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Example Vibe Project",
  description:
    "Claude Code 강의 더미 프로젝트. 한국어 학습자를 위한 핵심 개념 시각화 페이지를 포함합니다.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 인라인 스크립트가 첫 페인트 전에 data-theme를 붙이므로 서버 렌더와 달라질 수 있음
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* FOUC 방지 (docs/plans/002): 저장된 선호가 정확히 "light"일 때만 적용, 그 외·손상값은 다크 기본 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("theme")==="light")document.documentElement.dataset.theme="light"}catch(_){}`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <div className="mx-auto max-w-5xl px-6 py-10">{children}</div>
      </body>
    </html>
  );
}
