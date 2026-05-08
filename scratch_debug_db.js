require('dotenv').config();
const prisma = require('./src/config/database');

async function main() {
  try {
    const agents = await prisma.agent.findMany();
    console.log('Agents count:', agents.length);
    console.log(JSON.stringify(agents, null, 2));
  } catch (e) {
    console.error('Error querying agents:', e.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
