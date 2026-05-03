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

if (!process.env.REDIS_URL) {
  console.warn('⚠️  REDIS_URL non défini — BullMQ désactivé (mode mock)');
  connection = mockConnection;
} else {
  const isDev = process.env.NODE_ENV !== 'production';

  const redisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    enableOfflineQueue: true,
    connectTimeout: 5000,
    // En dev : 3 tentatives max puis abandon silencieux
    // En prod : backoff exponentiel plafonné à 5s
    retryStrategy: (times) => {
      if (isDev && times >= 3) {
        // Arrêt silencieux — le serveur continue sans Redis
        return null;
      }
      if (!isDev && times > 20) return null;
      return Math.min(times * 200, 5000);
    },
  };

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
    // Silencieux pour ECONNREFUSED et ENOTFOUND (Redis simplement absent)
    if (err.code !== 'ECONNREFUSED' && err.code !== 'ENOTFOUND') {
      console.warn('⚠️  Redis erreur:', err.code);
    }
  });

  connection.on('end', () => {
    isRedisReady = false;
    if (!isDev) console.warn('⚠️  Connexion Redis fermée');
  });

  // En dev, si Redis n'est pas là après 3s, on log une seule fois
  if (isDev) {
    setTimeout(() => {
      if (!isRedisReady) {
        console.warn('⚠️  Redis indisponible — jobs BullMQ exécutés en mode synchrone');
      }
    }, 3000);
  }
}

connection.isReady = () => isRedisReady;
module.exports = connection;
