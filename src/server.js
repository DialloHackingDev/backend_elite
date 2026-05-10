require('dotenv').config();
process.env.UV_THREADPOOL_SIZE = 64;

const app = require('./app');
const validateEnvironment = require('./config/env.validator');
const prisma = require('./config/database');

const PORT = process.env.PORT || 3000;

// ── Garde-fou global : empêche le crash sur promesse non gérée ─────────────────
process.on('unhandledRejection', (reason) => {
  console.error('⚠️  UnhandledRejection (ignoré):', reason?.message || reason);
});

process.on('uncaughtException', (err) => {
  console.error('⚠️  UncaughtException (ignoré):', err.message);
});

async function startServer() {
  try {
    validateEnvironment();
    await prisma.$connect();
    console.log('✅ Connecté à la base de données PostgreSQL.');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur en écoute sur http://0.0.0.0:${PORT}`);
      console.log(`📱 Pour mobile: http://192.168.1.107:${PORT}/api`);

      setTimeout(() => {
        try {
          require('./jobs/sms.queue');
          require('./jobs/sync.queue');
          console.log('✅ BullMQ Workers initialisés avec Redis');
        } catch (err) {
          console.warn("⚠️  Impossible d'initialiser BullMQ:", err.message);
        }
      }, 5000);
    });
  } catch (error) {
    console.error('❌ Erreur de démarrage du serveur:', error);
    process.exit(1);
  }
}

startServer();
