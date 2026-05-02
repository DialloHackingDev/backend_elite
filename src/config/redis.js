const Redis = require('ioredis');

const redisOptions = {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true,
  retryStrategy: (times) => {
    if (times > 3) return null; // Stop retrying after 3 attempts
    return Math.min(times * 100, 3000);
  }
};

let connection;

if (process.env.REDIS_URL && process.env.REDIS_URL !== 'redis://localhost:6379') {
  connection = new Redis(process.env.REDIS_URL, redisOptions);
  
  connection.on('connect', () => {
    console.log('✅ Connecté à Redis.');
  });

  connection.on('error', (err) => {
    // Silent in development mode
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Erreur de connexion Redis:', err.message);
    }
  });
} else {
  // Mock Redis for development without Redis
  console.log('⚠️  Redis non configuré - Mode sans file d\'attente (BullMQ désactivé)');
  connection = {
    status: 'mock',
    on: () => {},
    get: async () => null,
    set: async () => 'OK',
    del: async () => 1,
    quit: async () => {}
  };
}

module.exports = connection;
