import { NextResponse } from "next/server";
import { findConcept } from "@/lib/concepts";
import { AppError } from "@/lib/errors";
import { saveFeedback } from "@/lib/feedback-store";
import { logger } from "@/lib/logger";

/** AppError → 일관 JSON 응답 변환 (계획 003 설계 결정 3) */
function errorResponse(err: AppError) {
  return NextResponse.json(
    { error: err.code, message: err.message },
    { status: err.status },
  );
}

export async function POST(req: Request) {
  try {
    // JSON 파싱 실패는 중첩 try로 잡아 400으로 변환 (단일 try면 500으로 누출)
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new AppError("body가 유효한 JSON이 아닙니다", {
        status: 400,
        code: "invalid_json",
      });
    }

    // non-object body 가드: null·배열·문자열·숫자 등은 검증 불가
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      throw new AppError("body는 JSON 객체여야 합니다", {
        status: 400,
        code: "invalid_json",
      });
    }

    const { conceptSlug, rating, comment } = body as Record<string, unknown>;

    if (typeof conceptSlug !== "string") {
      throw new AppError("conceptSlug는 문자열이어야 합니다", {
        status: 400,
        code: "invalid_concept_slug",
      });
    }
    if (!findConcept(conceptSlug)) {
      throw new AppError(`존재하지 않는 concept입니다: ${conceptSlug}`, {
        status: 400,
        code: "unknown_concept_slug",
      });
    }
    if (
      !Number.isInteger(rating) ||
      (rating as number) < 1 ||
      (rating as number) > 5
    ) {
      throw new AppError("rating은 1~5 사이의 정수여야 합니다", {
        status: 400,
        code: "invalid_rating",
      });
    }
    if (
      comment !== undefined &&
      (typeof comment !== "string" || comment.length > 200)
    ) {
      throw new AppError("comment는 200자 이하의 문자열이어야 합니다", {
        status: 400,
        code: "invalid_comment",
      });
    }

    // 명시적 필드 픽 — unknown 필드가 저장소에 적재되지 않게 함
    const entry = saveFeedback({
      conceptSlug,
      rating: rating as number,
      comment: comment as string | undefined,
    });

    logger.info({
      module: "feedback",
      event: "saved",
      id: entry.id,
      conceptSlug: entry.conceptSlug,
    });
    return NextResponse.json({ id: entry.id, savedAt: entry.savedAt });
  } catch (err) {
    if (err instanceof AppError) {
      logger.warn({ module: "feedback", event: "rejected", code: err.code });
      return errorResponse(err);
    }
    // 내부 예외 메시지는 클라이언트에 노출하지 않음 (서버 로그에만)
    logger.error({
      module: "feedback",
      event: "error",
      message: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "internal_error", message: "내부 오류" },
      { status: 500 },
    );
  }
}
