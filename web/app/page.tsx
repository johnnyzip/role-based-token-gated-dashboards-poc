// web/app/page.tsx  (drop-in)

import Link from "next/link";
import prisma from "./api/prismaClient";
import ConnectBtn from "../components/ConnectBtn";

async function getProjects() {
  try {
    return await prisma.project.findMany({
      orderBy: { id: "asc" },
      select: { id: true, name: true, imageUrl: true, blurb: true },
    });
  } catch (e) {
    console.error("Failed to load projects:", e);
    return [];
  }
}

export default async function Home() {
  const projects = await getProjects();

  return (
    <div style={{ padding: 24 }}>
      {/* Header with Connect button */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>
          Token-Gated Dashboards
        </h1>

        {/* This shows even if Prisma fails */}
        <ConnectBtn />
      </header>

      {/* Project cards */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {projects.length === 0 ? (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: 16,
              border: "1px solid #2a2f36",
              borderRadius: 12,
              background: "#0f1117",
            }}
          >
            <b>No projects found</b>
            <div style={{ opacity: 0.7, marginTop: 6 }}>
              If you just switched databases or Prisma can’t connect, the page
              stays up so you can still sign in. Once the DB is reachable,
              cards will show here.
            </div>
          </div>
        ) : (
          projects.map((p) => (
            <article
              key={p.id}
              style={{
                border: "1px solid #2a2f36",
                borderRadius: 12,
                background: "#0f1117",
                overflow: "hidden",
              }}
            >
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  style={{ width: "100%", height: 140, objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    height: 140,
                    display: "grid",
                    placeItems: "center",
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,.06), transparent)",
                  }}
                >
                  <span style={{ opacity: 0.7 }}>No image</span>
                </div>
              )}

              <div style={{ padding: 14 }}>
                <h3 style={{ margin: "0 0 6px 0" }}>{p.name}</h3>
                <p style={{ margin: 0, opacity: 0.8 }}>
                  {p.blurb ?? "—"}
                </p>

                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <Link
                    href={`/dashboard/${p.id}/investor`}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #2a2f36",
                      textDecoration: "none",
                    }}
                  >
                    Investor
                  </Link>
                  <Link
                    href={`/dashboard/${p.id}/donor`}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #2a2f36",
                      textDecoration: "none",
                    }}
                  >
                    Donor
                  </Link>
                  <Link
                    href={`/dashboard/${p.id}/ops`}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #2a2f36",
                      textDecoration: "none",
                    }}
                  >
                    Ops
                  </Link>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
