import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createThirdwebClient, getContract } from "thirdweb";
import { balanceOf } from "thirdweb/extensions/erc1155";
import { sepolia } from "thirdweb/chains";
import prisma from "../../prismaClient";

const ACCESS_ERC1155 = process.env.NEXT_PUBLIC_ACCESS_ERC1155 as `0x${string}`;

async function requireAuth(): Promise<boolean> {
  // very light check; proper check done in actions/login.ts
  const jwt = cookies().get("jwt");
  return !!jwt?.value;
}

export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
  const authed = await requireAuth();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tokenId = BigInt(params.projectId);
  const user = cookies().get("tw_address")?.value; // populated by ConnectButton during login
  if (!user) return NextResponse.json({ error: "No wallet address" }, { status: 400 });

  const client = createThirdwebClient({ clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID! });
  const contract = getContract({ client, address: ACCESS_ERC1155, chain: sepolia });

  const bal = await balanceOf({ contract, owner: user as `0x${string}`, tokenId });
  if (bal === 0n) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // fetch data slice for this project
  const project = await prisma.project.findUnique({ where: { tokenId: Number(tokenId) } });
  if (!project) return NextResponse.json({ error: "Unknown project" }, { status: 404 });

  const rows = await prisma.dashboardRow.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return NextResponse.json({ project, rows });
}
