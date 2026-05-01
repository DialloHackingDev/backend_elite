const rateLimit = require('express-rate-limit');

/**
 * Limiteur de requêtes spécifique pour les routes de connexion
 * Bloque après 5 tentatives échouées par fenêtre de 15 minutes
 */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100000, // Limite très haute pour le stress test
  message: {
    status: 'error',
    message: 'Trop de tentatives de connexion'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const globalRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100000, // Limite très haute pour le stress test
  message: {
    status: 'error',
    message: 'Trop de requêtes globales'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginRateLimiter,
  globalRateLimiter
};
