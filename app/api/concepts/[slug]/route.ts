import { NextResponse } from "next/server";
import { findConcept } from "@/lib/concepts";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const concept = findConcept(slug);
  if (!concept) {
    console.log(`[concepts] not found: ${slug}`);
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ concept });
}
