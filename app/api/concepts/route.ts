import { NextResponse } from "next/server";
import { listConcepts } from "@/lib/concepts";
import { logger } from "@/lib/logger";

export async function GET() {
  logger.info({ module: "concepts", event: "list" });
  return NextResponse.json({ concepts: listConcepts() });
}
