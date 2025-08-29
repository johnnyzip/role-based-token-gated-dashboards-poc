import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "../../../prismaClient";

import { createThirdwebClient, getContract } from "thirdweb";
import { createAuth } from "thirdweb/auth";
import { privateKeyToAccount } from "thirdweb/wallets";
import { balanceOf } from "thirdweb/extensions/erc1155";
import { sepolia } from "thirdweb/chains";

const ACCESS_ERC1155 = process.env.NEXT_PUBLIC_ACCESS_ERC1155 as `0x${string}`;
const DOMAIN = process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN!;
const ADMIN_PK = process.env.AUTH_PRIVATE_KEY!;
const CLIENT_ID = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!;

// ✅ Define client locally so it's always in scope (works on Netlify too)
const client = createThirdwebClient({ clientId: CLIENT_ID });

const auth = createAuth({
  domain: DOMAIN,
  adminAccount: privateKeyToAccount({ client, privateKey: ADMIN_PK }),
  client,
});

const roleToId = (r: "investor" | "donor" | "ops") =>
  r === "investor" ? 1 : r === "donor" ? 2 : 3;

export async function GET(
  _req: Request,
  { params }: { params: { projectId: string; role: string } },
) {
  try {
    const pid = Number(params.projectId);
    if (!Number.isFinite(pid) || pid <= 0) {
      return NextResponse.json({ error: "Bad projectId" }, { status: 400 });
    }

    const role = params.role as "investor" | "donor" | "ops";
    if (!["investor", "donor", "ops"].includes(role)) {
      return NextResponse.json({ error: "Bad role" }, { status: 400 });
    }

    // ---- SESSION (JWT) ----
    const jwt = cookies().get("jwt")?.value;
    if (!jwt) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    const v = await auth.verifyJWT({ jwt });
    if (!v.valid) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const addr = cookies().get("tw_address")?.value as `0x${string}` | undefined;
    if (!addr) return NextResponse.json({ error: "No address in session" }, { status: 401 });

    // ---- ENSURE PROJECT EXISTS (BY tokenId) ----
    const project = await prisma.project.upsert({
      where: { tokenId: pid },
      update: {},
      create: {
        tokenId: pid,
        name: `Project ${pid}`,
        slug: `project-${pid}`,
        description: `Auto-created project ${pid}`,
      },
    });

    // ---- TOKEN GATE ----
    if (!ACCESS_ERC1155) {
      return NextResponse.json({ error: "Contract not configured" }, { status: 500 });
    }
    const tokenId = BigInt(pid * 100 + roleToId(role));
    const contract = getContract({ client, chain: sepolia, address: ACCESS_ERC1155 });
    const bal = await balanceOf({ contract, owner: addr, tokenId });
    if (bal === 0n) return NextResponse.json({ error: "Missing access token" }, { status: 403 });

    // ---- DATA ROWS (BY DB project.id) ----
    const rows = await prisma.dashboardRow.findMany({
      where: { projectId: project.id, role },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    return NextResponse.json({ project, rows });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
