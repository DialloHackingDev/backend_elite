const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET;
const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Génère un access token et un refresh token
 * @param {Object} payload - Les données de l'utilisateur à inclure dans le token
 * @returns {Object} - { accessToken, refreshToken }
 */
const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, SECRET_KEY, { expiresIn: ACCESS_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, SECRET_KEY, { expiresIn: REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken };
};

/**
 * Vérifie la validité d'un token JWT
 * @param {string} token - Le token JWT à vérifier
 * @returns {Object} - Le payload décodé
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    throw new Error('Token invalide ou expiré');
  }
};

module.exports = {
  generateTokens,
  verifyToken
};
