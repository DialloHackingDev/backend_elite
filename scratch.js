const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const req = await prisma.request.findUnique({ where: { id: "371dc8be-eec9-43d5-bf29-c04f13fd1a42" } });
  console.log('Request Status:', req.status);
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
