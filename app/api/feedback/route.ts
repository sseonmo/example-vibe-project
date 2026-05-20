import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // TODO(student): 학습자가 완성할 자리.
  // 요구사항 (IDEAS.md #3):
  // - body에서 { conceptSlug, rating, comment } 검증
  // - 메모리 저장소(또는 파일)에 저장
  // - 성공 시 { id, savedAt } 반환, 검증 실패 시 400 + AppError 일관 응답
  await req.text();
  return NextResponse.json({ stub: true, message: "not implemented" }, { status: 501 });
}
