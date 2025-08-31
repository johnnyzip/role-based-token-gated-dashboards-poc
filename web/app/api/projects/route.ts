import { NextResponse } from "next/server";
// If your prismaClient is at web/prismaClient.ts, this path is correct:
import prisma from "../prismaClient";

export const dynamic = "force-dynamic"; // don't cache in build

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        tokenId: true,
        imageUrl: true,
        blurb: true,
      },
    });
    return NextResponse.json({ projects });
  } catch (err) {
    console.error("GET /api/projects error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
