// ESM seed script (works on Netlify Node 20+ and locally)
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function ensureProject(id, name) {
  // Guarantee a stable project id (1/2/3) for your routes
  return prisma.project.upsert({
    where: { id },
    update: {},
    create: { id, name },
  });
}

function rowsFor(projectId) {
  // All values are strings (safe for TEXT column). Use JSON.stringify if you want structured values.
  return [
    // INVESTOR
    { projectId, role: "investor", key: "MRR",        value: JSON.stringify({ usd: 12345, delta: "+5%" }) },
    { projectId, role: "investor", key: "Runway",     value: JSON.stringify({ months: 14 }) },
    { projectId, role: "investor", key: "ARPU",       value: JSON.stringify({ usd: 32.8 }) },

    // DONOR
    { projectId, role: "donor",    key: "Impact Score",   value: JSON.stringify({ index: 78, trend: "up" }) },
    { projectId, role: "donor",    key: "Beneficiaries",  value: JSON.stringify({ count: 320, yoy: "+12%" }) },
    { projectId, role: "donor",    key: "Programs Active",value: "5" },

    // OPS
    { projectId, role: "ops",      key: "Incidents",  value: JSON.stringify({ sev1: 0, sev2: 1, note: "Failover tested" }) },
    { projectId, role: "ops",      key: "Deploys",    value: JSON.stringify({ weekly: 18, mttr_mins: 22 }) },
    { projectId, role: "ops",      key: "Uptime90d",  value: "99.95%" },
  ];
}

async function main() {
  // Make sure Projects 1–3 exist (your routes use /dashboard/1/* etc.)
  const p1 = await ensureProject(1, "Demo Project A");
  const p2 = await ensureProject(2, "Demo Project B");
  const p3 = await ensureProject(3, "Demo Project C");

  // Clean out existing rows for these projects so the seed is repeatable
  await prisma.dashboardRow.deleteMany({ where: { projectId: { in: [p1.id, p2.id, p3.id] } } });

  // Insert fresh rows
  await prisma.dashboardRow.createMany({ data: rowsFor(p1.id) });
  await prisma.dashboardRow.createMany({ data: rowsFor(p2.id) });
  await prisma.dashboardRow.createMany({ data: rowsFor(p3.id) });

  console.log("✅ Seeded mock data for projects:", p1.id, p2.id, p3.id);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
