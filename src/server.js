const os = require('os');
require('dotenv').config();
process.env.UV_THREADPOOL_SIZE = 64;

const app = require('./app');
const validateEnvironment = require('./config/env.validator');
const prisma = require('./config/database');

const PORT = process.env.PORT || 3000;

// Détecter l'IP locale pour faciliter le dev mobile
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

const LOCAL_IP = getLocalIP();

// ── Garde-fou global ───────────────────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('⚠️  UnhandledRejection:', reason?.message || reason);
});

process.on('uncaughtException', (err) => {
  console.error('⚠️  UncaughtException:', err.message);
});

async function startServer() {
  try {
    console.log('--- Démarrage NaissanceChain ---');
    validateEnvironment();
    
    await prisma.$connect();
    console.log('✅ Connecté à PostgreSQL.');

    // Initialisation des workers avant de démarrer le serveur HTTP
    try {
      require('./jobs/sms.queue');
      require('./jobs/sync.queue');
      console.log('✅ BullMQ Workers initialisés');
    } catch (err) {
      console.warn("⚠️  BullMQ non initialisé:", err.message);
    }

    // Démarrage du serveur Express
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur : http://localhost:${PORT}`);
      console.log(`📱 Mobile  : http://${LOCAL_IP}:${PORT}/api`);
    });

    // Garder le processus actif (Heartbeat)
    setInterval(() => {}, 1000 * 60 * 60); 

    // Gestion propre de l'arrêt
    process.on('SIGTERM', () => {
      console.log('SIGTERM reçu. Fermeture du serveur...');
      server.close(() => process.exit(0));
    });

  } catch (error) {
    console.error('❌ Erreur critique au démarrage:', error);
    process.exit(1);
  }
}

startServer();
