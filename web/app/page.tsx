import Link from "next/link";
import ConnectButton from "../components/ConnectBtn";

export default function Home() {
  return (
    <main style={{ maxWidth: 860, margin: "48px auto", padding: 16 }}>
      <h1>Stakeholder Dashboards (Role-aware)</h1>
      <p className="muted">
        Connect, then open a project dashboard. Access is granted by holding a **non-transferable** ERC-1155 token.
        Token id = <code>projectId * 100 + roleId</code>, where roleId is 1=investor, 2=donor, 3=ops.
      </p>
      <div style={{ margin: "24px 0" }}><ConnectButton /></div>
      <div className="grid">
        <div className="card">
          <h3>Project 1</h3>
          <p className="muted">Links per role (requires the matching token):</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link className="btn" href="/dashboard/1/investor">Investor</Link>
            <Link className="btn" href="/dashboard/1/donor">Donor</Link>
            <Link className="btn" href="/dashboard/1/ops">Ops</Link>
          </div>
        </div>
        <div className="card">
          <h3>Project 2</h3>
          <p className="muted">Links per role (requires the matching token):</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link className="btn" href="/dashboard/2/investor">Investor</Link>
            <Link className="btn" href="/dashboard/2/donor">Donor</Link>
            <Link className="btn" href="/dashboard/2/ops">Ops</Link>
          </div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 24 }}>
        <h3>Admin</h3>
        <p className="muted">Mint or revoke access for stakeholders (requires MINTER_ROLE).</p>
        <Link className="btn" href="/admin">Open Admin</Link>
      </div>
    </main>
  );
}
