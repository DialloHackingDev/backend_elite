const Redis = require('ioredis');

const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
};

const connection = new Redis(process.env.REDIS_URL, redisOptions);

connection.on('connect', () => {
  console.log('✅ Connecté à Redis.');
});

connection.on('error', (err) => {
  console.error('❌ Erreur de connexion Redis:', err);
});

module.exports = connection;
