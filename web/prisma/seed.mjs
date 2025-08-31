// @ts-check
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function roleRows(projectId) {
  return [
    { projectId, role: "investor", key: "MRR",           value: JSON.stringify({ usd: 12345, delta: "+5%" }) },
    { projectId, role: "donor",    key: "Impact Score",  value: JSON.stringify({ index: 78, trend: "up" }) },
    { projectId, role: "ops",      key: "Incidents",     value: JSON.stringify({ sev1: 0, sev2: 1, note: "Failover tested" }) },
  ];
}

async function upsertProject(id, name, imageUrl, blurb) {
  // tokenId here is just a base (projectId * 100) for reference
  const tokenId = id * 100;
  return prisma.project.upsert({
    where: { id },
    update: { name, imageUrl, blurb, tokenId },
    create: { id, name, imageUrl, blurb, tokenId },
  });
}

export default async function main() {
  const p1 = await upsertProject(
    1,
    "Clean Water Program",
    "https://images.unsplash.com/photo-1508697014387-db70aad34f4c?q=80&w=1200&auto=format&fit=crop",
    "Delivering safe drinking water to remote communities."
  );
  const p2 = await upsertProject(
    2,
    "EdTech Access",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop",
    "Low-cost devices and digital curricula for learners."
  );

  // clear and reseed rows for idempotency
  await prisma.dashboardRow.deleteMany({ where: { projectId: { in: [p1.id, p2.id] } } });
  await prisma.dashboardRow.createMany({ data: roleRows(p1.id) });
  await prisma.dashboardRow.createMany({ data: roleRows(p2.id) });

  console.log("Seeded projects + rows");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().finally(() => prisma.$disconnect());
}
