const rateLimit = require('express-rate-limit');

/**
 * Limiteur de requêtes spécifique pour les routes de connexion
 * Bloque après 5 tentatives échouées par fenêtre de 15 minutes
 */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite chaque IP à 5 requêtes par `windowMs`
  message: {
    status: 'error',
    message: 'Trop de tentatives de connexion depuis cette adresse IP, veuillez réessayer après 15 minutes'
  },
  standardHeaders: true, // Renvoie les headers `RateLimit-*`
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
});

/**
 * Limiteur global optionnel (ex: 100 requêtes par minute)
 */
const globalRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limite chaque IP à 100 requêtes par minute
  message: {
    status: 'error',
    message: 'Trop de requêtes globales, veuillez ralentir'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginRateLimiter,
  globalRateLimiter
};
