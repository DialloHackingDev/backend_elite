const Redis = require('ioredis');

// Objet mock utilisé quand Redis est indisponible
const mockConnection = {
  status: 'mock',
  on: () => mockConnection,
  once: () => mockConnection,
  get: async () => null,
  set: async () => 'OK',
  del: async () => 1,
  quit: async () => {},
  isReady: () => false,
};

let connection;
let isRedisReady = false;

if (!process.env.REDIS_URL || process.env.REDIS_DISABLED === 'true') {
  console.warn('⚠️  Redis désactivé ou REDIS_URL non défini — BullMQ en mode mock');
  connection = mockConnection;
} else {
  const isDev = process.env.NODE_ENV !== 'production';

  const redisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    enableOfflineQueue: false, // Ne pas accumuler les requêtes si Redis est absent
    connectTimeout: 2000,
    retryStrategy: (times) => {
      if (isDev && times >= 2) {
        // En dev, on abandonne très vite pour ne pas bloquer le démarrage
        return null;
      }
      if (!isDev && times > 10) return null;
      return Math.min(times * 500, 5000);
    },
  };

  try {
    connection = new Redis(process.env.REDIS_URL, redisOptions);

    connection.on('connect', () => {
      isRedisReady = true;
      console.log('✅ Redis connecté.');
    });

    connection.on('ready', () => {
      isRedisReady = true;
      console.log('✅ Redis prêt.');
    });

    connection.on('error', (err) => {
      isRedisReady = false;
      // On ne loggue l'erreur de connexion qu'une seule fois ou si ce n'est pas un ECONNREFUSED attendu
      if (err.code !== 'ECONNREFUSED' && err.code !== 'ENOTFOUND') {
        console.warn(`⚠️  Redis erreur: ${err.code}`);
      }
    });

    connection.on('end', () => {
      isRedisReady = false;
    });

  } catch (err) {
    console.error('❌ Erreur critique lors de l\'initialisation Redis:', err.message);
    connection = mockConnection;
  }
}

// Méthode helper pour vérifier la disponibilité réelle
connection.isRedisAvailable = () => {
  if (connection.status === 'mock') return false;
  return isRedisReady;
};

module.exports = connection;
