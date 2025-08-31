import Link from "next/link";
import { headers, cookies } from "next/headers";

export const dynamic = "force-dynamic";

type ApiOk = { project: { id: number; tokenId: number; name: string }; rows: Array<{ id: number; key: string; value: string; createdAt: string }> };
type ApiErr = { error: string };
type ApiResp = ApiOk | ApiErr;

async function fetchData(projectId: string): Promise<ApiResp> {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (!host) return { error: "no_host" };

  const url = `${proto}://${host}/api/data/${projectId}/investor`;

  // forward cookies to API so auth works on the server
  const cookieHeader = cookies().getAll().map(c => `${c.name}=${c.value}`).join("; ");

  const res = await fetch(url, {
    headers: { cookie: cookieHeader },
    // avoid caching SSR responses
    cache: "no-store",
  });

  if (res.status === 401) return { error: "auth" };
  if (res.status === 403) return { error: "forbidden" };
  if (!res.ok) return { error: `http_${res.status}` };
  return res.json();
}

export default async function Page({ params }: { params: { projectId: string } }) {
  const data = await fetchData(params.projectId);

  if ("error" in data) {
    return (
      <main style={{ maxWidth: 860, margin: "48px auto", padding: 16 }}>
        <h1>Project {params.projectId} — Investor</h1>
        {data.error === "auth" ? (
          <>
            <p>Please connect & login on this domain, then refresh.</p>
            <p><Link href="/">Go to Home</Link></p>
          </>
        ) : data.error === "forbidden" ? (
          <p>Forbidden: you don’t hold the investor access token for this project.</p>
        ) : (
          <p>Failed to load data ({data.error}).</p>
        )}
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 860, margin: "48px auto", padding: 16 }}>
// inside the component render:
<h1>Investor view — Project {params.projectId}</h1>
<p className="muted">You’ll see investor metrics for this project if your wallet holds the investor access token.</p>

      <div className="grid">
        {data.rows.map((r) => (
          <div key={r.id} className="card">
            <div className="card-title">{r.key}</div>
            <div className="card-body">{r.value}</div>
          </div>
        ))}
      </div>
    </main>
  );
}

