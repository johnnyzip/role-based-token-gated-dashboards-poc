export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createThirdwebClient, getContract } from "thirdweb";
import { createAuth } from "thirdweb/auth";
import { privateKeyToAccount } from "thirdweb/wallets";
import { balanceOf } from "thirdweb/extensions/erc1155";
import { sepolia } from "thirdweb/chains";
import prisma from "../../../prismaClient";

// --- env ---
const ACCESS_ERC1155 = process.env.NEXT_PUBLIC_ACCESS_ERC1155 as `0x${string}` | undefined;
const DOMAIN = process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN || "";
const ADMIN_PK = process.env.AUTH_PRIVATE_KEY || "";
const CLIENT_ID = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "";
const SECRET = process.env.THIRDWEB_SECRET_KEY || "";

// prefer secret on server
const client = SECRET
  ? createThirdwebClient({ secretKey: SECRET })
  : createThirdwebClient({ clientId: CLIENT_ID });

const auth = createAuth({
  domain: DOMAIN,
  adminAccount: privateKeyToAccount({ client, privateKey: ADMIN_PK }),
  client,
});

const ROLES = ["investor", "donor", "ops"] as const;
type Role = typeof ROLES[number];

function parseRole(r: string): Role | null {
  return (ROLES as readonly string[]).includes(r) ? (r as Role) : null;
}
function tokenIdFor(pid: number, role: Role) {
  const map = { investor: 1, donor: 2, ops: 3 } as const;
  return BigInt(pid * 100 + map[role]);
}

export async function GET(
  _req: Request,
  ctx: { params: { projectId: string; role: string } },
) {
  try {
    // ----- guards (env/params/auth) -----
    if (!ACCESS_ERC1155 || !DOMAIN || (!CLIENT_ID && !SECRET) || !ADMIN_PK) {
      return NextResponse.json({ error: "missing_env" }, { status: 500 });
    }

    const projectId = Number(ctx.params.projectId);
    if (!Number.isFinite(projectId) || projectId <= 0) {
      return NextResponse.json({ error: "bad_projectId" }, { status: 400 });
    }

    const role = parseRole(ctx.params.role);
    if (!role) return NextResponse.json({ error: "bad_role" }, { status: 400 });

    const jwt = cookies().get("jwt")?.value;
    if (!jwt) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

    const verified = await auth.verifyJWT({ jwt });
    if (!verified.valid) return NextResponse.json({ error: "invalid_session" }, { status: 401 });

    const addr = cookies().get("tw_address")?.value as `0x${string}` | undefined;
    if (!addr) return NextResponse.json({ error: "no_address" }, { status: 401 });

    // ----- token gate check -----
    const contract = getContract({ client, chain: sepolia, address: ACCESS_ERC1155 });
    const bal = await balanceOf({ contract, owner: addr, tokenId: tokenIdFor(projectId, role) });

    if (bal === 0n) {
      // clean 403 instead of throwing
      return NextResponse.json(
        { error: "forbidden", reason: "missing_token", role, tokenId: tokenIdFor(projectId, role).toString() },
        { status: 403 },
      );
    }

    // ----- fetch data -----
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "not_found_project" }, { status: 404 });

    const rows = await prisma.dashboardRow.findMany({
      where: { projectId, role },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ project, rows });
  } catch (e: any) {
    // never crash the route
    console.error("data route error:", e?.stack || e?.message || e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

