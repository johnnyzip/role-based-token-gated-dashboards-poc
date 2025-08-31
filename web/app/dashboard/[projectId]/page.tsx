// web/app/dashboard/[projectId]/page.tsx
import Link from "next/link";

export default function ProjectIndex({ params }: { params: { projectId: string } }) {
  const { projectId } = params;
  const pid = Number(projectId);
  const showTokenIds = Number.isFinite(pid);
  const investorId = showTokenIds ? pid * 100 + 1 : null;
  const donorId = showTokenIds ? pid * 100 + 2 : null;
  const opsId = showTokenIds ? pid * 100 + 3 : null;

  return (
    <main style={{ maxWidth: 860, margin: "48px auto", padding: 16 }}>
      <h1>Project {projectId}</h1>
      <p className="muted">Choose a role to open the gated dashboard.</p>

      <div className="grid">
        <div className="card">
          <h3>Investor</h3>
          {showTokenIds && <p className="muted">Requires tokenId <b>{investorId}</b></p>}
          <Link className="btn" href={`/dashboard/${projectId}/investor`}>Open Investor</Link>
        </div>

        <div className="card">
          <h3>Donor</h3>
          {showTokenIds && <p className="muted">Requires tokenId <b>{donorId}</b></p>}
          <Link className="btn" href={`/dashboard/${projectId}/donor`}>Open Donor</Link>
        </div>

        <div className="card">
          <h3>Ops</h3>
          {showTokenIds && <p className="muted">Requires tokenId <b>{opsId}</b></p>}
          <Link className="btn" href={`/dashboard/${projectId}/ops`}>Open Ops</Link>
        </div>
      </div>
    </main>
  );
}
