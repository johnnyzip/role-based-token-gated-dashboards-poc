"use client";

import { ConnectButton } from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";
import { sepolia } from "thirdweb/chains";
import { client } from "../src/lib/client";
import { generatePayload, isLoggedIn, login, logout } from "../src/actions/login";

export default function ConnectBtn() {
  return (
    <ConnectButton
      client={client}
      accountAbstraction={{ chain: sepolia, sponsorGas: true }}
      wallets={[inAppWallet({ auth: { options: ["email"] } })]}
      auth={{
        isLoggedIn: async () => isLoggedIn(),
        getLoginPayload: async ({ address }) => generatePayload({ address }),
        doLogin: async (params) => login(params),
        doLogout: async () => logout(),
      }}
      theme="light"
    />
  );
}
