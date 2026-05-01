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
  
  // Vérifie s'il existe déjà un administrateur principal
  const existingAdmin = await prisma.agent.findUnique({
    where: { nationalAgentId: 'ADMIN-0001' }
  });

  if (existingAdmin) {
    console.log('Admin account already exists!');
    return;
  }

  const saltRounds = 12;
  const passwordHash = await bcrypt.hash('admin123', saltRounds);

  const admin = await prisma.agent.create({
    data: {
      nationalAgentId: 'ADMIN-0001',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      prefectureAssignment: 'Conakry',
      passwordHash: passwordHash
    }
  });

  console.log(`Admin user created!`);
  console.log(`ID National: ${admin.nationalAgentId}`);
  console.log(`Mot de passe: admin123`);
  console.log(`Rôle: ${admin.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
