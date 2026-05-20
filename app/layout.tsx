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
    <html lang="ko">
      <body className="min-h-screen antialiased">
        <div className="mx-auto max-w-5xl px-6 py-10">{children}</div>
      </body>
    </html>
  );
}
