// web/prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const p1 = await prisma.project.upsert({
    where: { tokenId: 1 },
    update: {},
    create: { tokenId: 1, name: "Project 1", slug: "project-1", description: "Sample project 1" },
  });
  const p2 = await prisma.project.upsert({
    where: { tokenId: 2 },
    update: {},
    create: { tokenId: 2, name: "Project 2", slug: "project-2", description: "Sample project 2" },
  });

  await prisma.dashboardRow.createMany({
    data: [
      // Project 1
      { projectId: p1.id, role: "investor", key: "MRR",           value: JSON.stringify({ usd: 12345, delta: "+5%" }) },
      { projectId: p1.id, role: "donor",    key: "Impact Score",  value: JSON.stringify({ index: 78, trend: "up" }) },
      { projectId: p1.id, role: "ops",      key: "Incidents",     value: JSON.stringify({ sev1: 0, sev2: 1, note: "Failover tested" }) },

      // Project 2
      { projectId: p2.id, role: "investor", key: "Runway",        value: JSON.stringify({ months: 14 }) },
      { projectId: p2.id, role: "donor",    key: "Beneficiaries", value: JSON.stringify({ count: 320, yoy: "+12%" }) },
      { projectId: p2.id, role: "ops",      key: "Deploys",       value: JSON.stringify({ weekly: 18, mttr_mins: 22 }) },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
