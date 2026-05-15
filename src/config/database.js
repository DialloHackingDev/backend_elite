const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL && process.env.DATABASE_URL.trim();

if (!connectionString) {
  console.error('❌ DATABASE_URL non définie ! Le serveur ne peut pas démarrer.');
  process.exit(1);
}

if (/\r|\n|\s/.test(connectionString)) {
  console.error('❌ DATABASE_URL invalide : elle contient des espaces ou des retours à la ligne.');
  process.exit(1);
}

console.log('📊 Connexion à PostgreSQL...');
console.log('🔗 DATABASE_URL host:', connectionString.replace(/postgresql:\/\/(.*?):.*?@/, 'postgresql://$1:*****@'));

const pool = new Pool({
  connectionString,
  max: 100,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
