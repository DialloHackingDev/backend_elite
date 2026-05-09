const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const requests = await prisma.request.findMany();
  console.log(requests);
}

main().catch(console.error).finally(() => prisma.$disconnect());
