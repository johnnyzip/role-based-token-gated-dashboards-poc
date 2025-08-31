export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createThirdwebClient, getContract } from "thirdweb";
import { createAuth } from "thirdweb/auth";
import { privateKeyToAccount } from "thirdweb/wallets";
import { balanceOf } from "thirdweb/extensions/erc1155";
import { sepolia } from "thirdweb/chains";

const ACCESS_ERC1155 = process.env.NEXT_PUBLIC_ACCESS_ERC1155 as `0x${string}` | undefined;
const DOMAIN = process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN || "";
const ADMIN_PK = process.env.AUTH_PRIVATE_KEY || "";
const CLIENT_ID = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "";
const SECRET = process.env.THIRDWEB_SECRET_KEY || "";

// Prefer secretKey on server, fall back to clientId
const client = SECRET
  ? createThirdwebClient({ secretKey: SECRET })
  : createThirdwebClient({ clientId: CLIENT_ID });

const auth = createAuth({
  domain: DOMAIN,
  adminAccount: privateKeyToAccount({ client, privateKey: ADMIN_PK }),
  client,
});

function tokenIdFor(pid: number, role: "investor" | "donor" | "ops") {
  const map = { investor: 1, donor: 2, ops: 3 } as const;
  return BigInt(pid * 100 + map[role]);
}

function mkTimer() {
  const parts: [string, number][] = [];
  let last = Date.now();
  return {
    mark(label: string) {
      const now = Date.now();
      parts.push([label, now - last]);
      last = now;
    },
    header() {
      return parts.map(([k, v]) => `${k};dur=${v}`).join(", ");
    },
  };
}

export async function GET(req: Request) {
  const t = mkTimer();
  try {
    // Basic env guards (don’t leak secrets)
    const missing: string[] = [];
    if (!ACCESS_ERC1155) missing.push("NEXT_PUBLIC_ACCESS_ERC1155");
    if (!DOMAIN) missing.push("NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN");
    if (!ADMIN_PK) missing.push("AUTH_PRIVATE_KEY");
    if (!CLIENT_ID && !SECRET) missing.push("THIRDWEB_SECRET_KEY or NEXT_PUBLIC_THIRDWEB_CLIENT_ID");
    if (missing.length) {
      return NextResponse.json({ error: "missing_env", missing }, { status: 500 });
    }

    const url = new URL(req.url);
    const pid = Number(url.searchParams.get("projectId") ?? "1");
    if (!Number.isFinite(pid) || pid <= 0) {
      return NextResponse.json({ error: "bad_projectId" }, { status: 400 });
    }

    // Auth cookie
    const jwt = cookies().get("jwt")?.value;
    if (!jwt) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });
    t.mark("read_cookies");

    // Verify session
    let v;
    try {
      v = await auth.verifyJWT({ jwt });
    } catch (e: any) {
      console.error("verifyJWT threw:", e?.message || e);
      return NextResponse.json({ error: "invalid_session_verify_threw" }, { status: 401 });
    }
    if (!v.valid) return NextResponse.json({ error: "invalid_session" }, { status: 401 });
    t.mark("jwt");

    // Address
    const addr = (cookies().get("tw_address")?.value || url.searchParams.get("address")) as
      | `0x${string}`
      | undefined;
    if (!addr) return NextResponse.json({ error: "no_address" }, { status: 401 });

    // Contract + balances
    const contract = getContract({ client, chain: sepolia, address: ACCESS_ERC1155! });
    t.mark("contract");

    const [i, d, o] = await Promise.all([
      balanceOf({ contract, owner: addr, tokenId: tokenIdFor(pid, "investor") }),
      balanceOf({ contract, owner: addr, tokenId: tokenIdFor(pid, "donor") }),
      balanceOf({ contract, owner: addr, tokenId: tokenIdFor(pid, "ops") }),
    ]);
    t.mark("chain");

    return NextResponse.json(
      {
        ok: true,
        projectId: pid,
        address: addr,
        balances: { investor: i.toString(), donor: d.toString(), ops: o.toString() },
      },
      { headers: { "Server-Timing": t.header() } },
    );
  } catch (e: any) {
    console.error("balances route error:", e?.stack || e?.message || e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
