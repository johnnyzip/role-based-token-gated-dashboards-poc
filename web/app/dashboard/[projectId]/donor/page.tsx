import { notFound } from "next/navigation";
import { cookies } from "next/headers";

async function fetchData(projectId: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const cookieHeader = cookies().getAll().map(({ name, value }) => `${name}=${value}`).join("; ");
  const res = await fetch(`${base}/api/data/${projectId}/donor`, {
    cache: "no-store",
    headers: { cookie: cookieHeader },
  });
  if (!res.ok) {
    if (res.status === 403) throw new Error("Forbidden: you don't hold the required access token for role 'investor'.");
    if (res.status === 401) throw new Error("Please connect & login first.");
    notFound();
  }
  return res.json();
}

export default async function Page({ params }: { params: { projectId: string } }) {
  const data = await fetchData(params.projectId);
  return (
    <main style={{ maxWidth: 860, margin: "48px auto", padding: 16 }}>
      <h1>Project {params.projectId} — Investor</h1>
      <p className="muted">Showing last {data.rows.length} rows for the <b>investor</b> role.</p>
      <div className="grid">
        {data.rows.map((row: any) => {
          let parsed = row.value;
          try { parsed = typeof row.value === "string" ? JSON.parse(row.value) : row.value; } catch {}
          return (
            <div className="card" key={row.id}>
              <div style={{ fontSize: 12 }} className="muted">{new Date(row.createdAt).toLocaleString()}</div>
              <div style={{ marginTop: 8 }}><b>{row.key}</b></div>
              <pre style={{ whiteSpace: "pre-wrap" }}>
                {typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2)}
              </pre>
            </div>
          );
        })}
      </div>
    </main>
  );
}
