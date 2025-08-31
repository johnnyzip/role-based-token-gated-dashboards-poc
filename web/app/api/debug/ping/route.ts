export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  return NextResponse.json({
    ok: true,
    cookies: {
      jwt: !!cookies().get("jwt"),
      tw_address: cookies().get("tw_address")?.value ?? null,
    },
    env: {
      ACCESS_ERC1155: !!process.env.NEXT_PUBLIC_ACCESS_ERC1155,
      DOMAIN: process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN || null,
      CLIENT_ID: !!process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
      SECRET: !!process.env.THIRDWEB_SECRET_KEY,
    },
  });
}
