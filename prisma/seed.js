const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');
  
  // Création de l'administrateur avec un coût bcrypt réduit pour les tests
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash('admin123', saltRounds);

  const admin = await prisma.agent.upsert({
    where: { nationalAgentId: 'ADMIN-0001' },
    update: { passwordHash: passwordHash },
    create: {
      nationalAgentId: 'ADMIN-0001',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      prefectureAssignment: 'Conakry',
      passwordHash: passwordHash
    }
  });

  console.log(`Admin user: ${admin.nationalAgentId} (Prêt)`);
  console.log(`ID National: ${admin.nationalAgentId}`);
  console.log(`Mot de passe: admin123`);
  console.log(`Rôle: ${admin.role}`);

  // Créer un établissement par défaut
  const establishment = await prisma.establishment.upsert({
    where: { code: 'IGN-001' },
    update: {},
    create: {
      code: 'IGN-001',
      name: 'Maternité Ignace Deen',
      type: 'MATERNITY',
      prefecture: 'Conakry',
      subPrefecture: 'Kaloum'
    }
  });

  console.log(`Établissement créé: ${establishment.name} (${establishment.code})`);

  // Créer 500 agents de test pour le load testing
  console.log('Creating 500 test agents...');
  const agentPasswordHash = await bcrypt.hash('password123', saltRounds);
  
  for (let i = 1; i <= 500; i++) {
    const agentId = `AGENT-${String(i).padStart(4, '0')}`;
    await prisma.agent.upsert({
      where: { nationalAgentId: agentId },
      update: { passwordHash: agentPasswordHash },
      create: {
        nationalAgentId: agentId,
        firstName: `Agent${i}`,
        lastName: 'Test',
        role: 'AGENT',
        status: 'ACTIVE',
        prefectureAssignment: 'Conakry',
        passwordHash: agentPasswordHash
      }
    });
  }
  console.log('500 test agents created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
