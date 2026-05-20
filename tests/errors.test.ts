import { describe, it, expect } from "vitest";
import { AppError } from "@/lib/errors";

describe("lib/errors", () => {
  it("기본값은 500 + internal_error", () => {
    const err = new AppError("boom");
    expect(err.status).toBe(500);
    expect(err.code).toBe("internal_error");
    expect(err.message).toBe("boom");
  });

  it("status·code를 override 할 수 있다", () => {
    const err = new AppError("nope", { status: 400, code: "invalid_input" });
    expect(err.status).toBe(400);
    expect(err.code).toBe("invalid_input");
  });
});
