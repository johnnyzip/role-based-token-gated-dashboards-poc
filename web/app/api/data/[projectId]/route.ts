import { NextResponse } from "next/server";
import prisma from "../../prismaClient";

export async function GET(
  _req: Request,
  { params }: { params: { projectId: string } },
) {
  const pid = Number(params.projectId);
  if (!Number.isFinite(pid) || pid <= 0) {
    return NextResponse.json({ error: "Bad projectId" }, { status: 400 });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { tokenId: pid },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const rows = await prisma.dashboardRow.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ project, rows });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
