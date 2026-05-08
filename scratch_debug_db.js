require('dotenv').config();
const prisma = require('./src/config/database');

async function main() {
  const agents = await prisma.agent.findMany();
  console.log('--- AGENTS ---');
  agents.forEach(a => {
    console.log(`ID: ${a.nationalAgentId}, Role: ${a.role}, Name: ${a.firstName} ${a.lastName}`);
  });

  const citizens = await prisma.citizen.findMany();
  console.log('--- CITIZENS ---');
  citizens.forEach(c => {
    console.log(`Phone: ${c.phoneNumber}, Name: ${c.fullName}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
