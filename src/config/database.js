const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL non définie ! Le serveur ne peut pas démarrer.');
  process.exit(1);
}

console.log('📊 Connexion à PostgreSQL...');

const pool = new Pool({ 
  connectionString: connectionString,
  max: 100,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
