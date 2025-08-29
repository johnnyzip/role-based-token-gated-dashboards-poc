"use client";

import { useState } from "react";
import ConnectBtn from "../../components/ConnectBtn";
import { useActiveAccount } from "thirdweb/react";
import { getContract, prepareContractCall, sendTransaction } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { client } from "../../src/lib/client";

const ACCESS_ERC1155 = process.env.NEXT_PUBLIC_ACCESS_ERC1155 as `0x${string}`;

// role -> id helper
const roleToId = (r: "investor" | "donor" | "ops") => (r === "investor" ? 1 : r === "donor" ? 2 : 3);

// Minimal ABI (functions we call + AccessControl error for clear messages)
const abi = [
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address[]", name: "recipients", type: "address[]" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    name: "mintBatch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "bytes32", name: "neededRole", type: "bytes32" },
    ],
    name: "AccessControlUnauthorizedAccount",
    type: "error",
  },
] as const;

export default function Admin() {
  const account = useActiveAccount(); // AA address when connected
  const [address, setAddress] = useState("");
  const [projectId, setProjectId] = useState(1);
  const [role, setRole] = useState<"investor" | "donor" | "ops">("investor");
  const [status, setStatus] = useState<string>("");

  const contract = getContract({ client, chain: sepolia, address: ACCESS_ERC1155, abi });

  async function mintOne() {
    if (!account) return setStatus("Connect as an admin with MINTER_ROLE.");
    try {
      setStatus("Minting...");
      const tokenId = BigInt(projectId * 100 + roleToId(role));
      const tx = prepareContractCall({ contract, method: "mint", params: [address as `0x${string}`, tokenId, 1n] });
      await sendTransaction({ account, transaction: tx });
      setStatus(`✅ Minted tokenId ${tokenId.toString()} to ${address}`);
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (msg.includes("AccessControlUnauthorizedAccount") || msg.includes("missing role")) {
        setStatus("❌ Your connected wallet is missing MINTER_ROLE on the contract.");
      } else {
        setStatus(`❌ ${msg}`);
      }
    }
  }

  async function burnOne() {
    if (!account) return setStatus("Connect as an admin with MINTER_ROLE.");
    try {
      setStatus("Burning...");
      const tokenId = BigInt(projectId * 100 + roleToId(role));
      const tx = prepareContractCall({ contract, method: "burn", params: [address as `0x${string}`, tokenId, 1n] });
      await sendTransaction({ account, transaction: tx });
      setStatus(`✅ Burned tokenId ${tokenId.toString()} from ${address}`);
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (msg.includes("AccessControlUnauthorizedAccount") || msg.includes("missing role")) {
        setStatus("❌ Your connected wallet is missing MINTER_ROLE on the contract.");
      } else {
        setStatus(`❌ ${msg}`);
      }
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "48px auto", padding: 16 }}>
      <h1>Admin — Mint/Revoke Access</h1>

      <div style={{ margin: "16px 0" }}>
        <ConnectBtn />
        <div className="muted" style={{ marginTop: 8 }}>
          {account ? `Connected (AA): ${account.address}` : "Not connected"}
        </div>
        <button
          className="btn"
          type="button"
          style={{ marginTop: 8 }}
          onClick={() => account && setAddress(account.address)}
          disabled={!account}
        >
          Use connected address
        </button>
      </div>

      {!ACCESS_ERC1155 && (
        <div className="card" style={{ marginBottom: 16, borderColor: "#b33" }}>
          <b>Missing NEXT_PUBLIC_ACCESS_ERC1155</b> — set your deployed contract address in <code>web/.env</code>.
        </div>
      )}

      <div className="card" style={{ display: "grid", gap: 12 }}>
        <label>Recipient Address</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x..."
          style={{ padding: 10, borderRadius: 8, border: "1px solid #2a2f36", background: "#0f1117", color: "white" }}
        />

        <label>Project ID</label>
        <input
          type="number"
          value={projectId}
          onChange={(e) => setProjectId(parseInt(e.target.value || "1"))}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #2a2f36", background: "#0f1117", color: "white" }}
        />

        <label>Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #2a2f36", background: "#0f1117", color: "white", width: 200 }}
        >
          <option value="investor">Investor (1)</option>
          <option value="donor">Donor (2)</option>
          <option value="ops">Ops (3)</option>
        </select>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="btn" type="button" onClick={mintOne} disabled={!account}>Mint</button>
          <button className="btn" type="button" onClick={burnOne} disabled={!account}>Revoke</button>
        </div>

        <div className="muted" style={{ marginTop: 8 }}>{status}</div>
      </div>
    </div>
  );
}
