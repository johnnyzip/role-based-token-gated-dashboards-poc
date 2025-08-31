"use server";

import { cookies } from "next/headers";
import { createAuth, type VerifyLoginPayloadParams } from "thirdweb/auth";
import { privateKeyToAccount } from "thirdweb/wallets";
import { client } from "../lib/client";

const domain = process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN!;
const adminPk = process.env.AUTH_PRIVATE_KEY!;
const CHAIN_ID = 11155111; // Sepolia

const auth = createAuth({
  domain,
  // Admin only signs JWTs; no funds needed
  adminAccount: privateKeyToAccount({ client, privateKey: adminPk }),
  client, // important for verification
});

export async function generatePayload({ address }: { address: string }) {
  // Explicitly pin to Sepolia so the signature verifies consistently
  return auth.generatePayload({ address, chainId: CHAIN_ID });
}

export async function login(payload: VerifyLoginPayloadParams) {
  const verified = await auth.verifyPayload(payload);
  if (!verified.valid) throw new Error("Invalid signature");
  const jwt = await auth.generateJWT({ payload: verified.payload });
  cookies().set("jwt", jwt, { httpOnly: true, sameSite: "lax", path: "/" });
  cookies().set("tw_address", verified.payload.address, { sameSite: "lax", path: "/" });
}

export async function isLoggedIn() {
  const token = cookies().get("jwt")?.value;
  if (!token) return false;
  const res = await auth.verifyJWT({ jwt: token });
  return res.valid;
}

export async function logout() {
  cookies().delete("jwt");
  cookies().delete("tw_address");
}
