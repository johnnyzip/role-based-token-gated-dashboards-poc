# Sepolia Token-Gated Dashboards (thirdweb + ERC-1155 soulbound)

This starter includes:
- **Non-transferable ERC-1155** where `tokenId == projectId` (OpenZeppelin v5 `_update` hook).
- **Next.js 14 App Router** with **thirdweb v5** (Auth + In-App Wallets + sponsored gas on Sepolia).
- **Server-side gating**: `/api/data/[projectId]` checks `balanceOf(address, tokenId)` before returning data.
- **********************SQLite + Prisma** sample data.(actually neon postgrrs, sql to be executed within neon dash or vscode db connection, as the prisma bulshit doesnt work)************************

## Quickstart

### 1) Deploy the ERC-1155 access contract (Sepolia)
```bash
cd contracts
cp .env.example .env
# fill SEPOLIA_RPC + DEPLOYER_PRIVATE_KEY
npm i
npm run build
npm run deploy:sepolia
# note the deployed address
```

### 2) Run the web app
```bash
cd ../web
cp .env.example .env.local
# Fill NEXT_PUBLIC_THIRDWEB_CLIENT_ID, THIRDWEB_SECRET_KEY, AUTH_PRIVATE_KEY (any private key), NEXT_PUBLIC_ACCESS_ERC1155 (from step 1)
npm i
npm run db:gen && npm run db:push && npm run db:seed
npm run dev
```

Open http://localhost:3000
- Connect using email / Google / passkey (creates an **in-app wallet**).
- You won't see Project 1/2 dashboards unless your connected address holds tokenId 1 or 2.
- Mint access using Hardhat console or a simple script:
  ```ts
  // inside contracts/ scripts or console
  // await contract.mint("0xUSER", 1, 1) // grant access to Project 1
  ```

### Notes
- Transfers are blocked by `_update` to enforce non-transferability.
- Gasless is enabled for in-app wallets via `smartAccount: { chain: sepolia, sponsorGas: true }`.
- All authorization checks happen on the server (API route), not just in the UI.
```


## Roles & Token IDs
Roles are: **investor=1**, **donor=2**, **ops=3**. We encode a composite ERC-1155 token id as:
```
tokenId = projectId * 100 + roleId
```
Example: Project 2 + donor → tokenId `202`.

## Admin UI (mint/revoke)
- Visit `/admin` in the web app.
- Connect with a wallet that has `MINTER_ROLE` on the access contract.
- Choose project, role, and address; **Mint** to grant or **Revoke** to burn.
- To grant your admin wallet the MINTER_ROLE:
  ```bash
  cd contracts
  CONTRACT=0xYourContract NEW_MINTER=0xYourAdmin npx hardhat run scripts/grantMinter.ts --network sepolia
  ```

## API routes
- `GET /api/data/[projectId]/[role]` — verifies login, checks ERC-1155 balance for computed tokenId, returns role-specific rows.
