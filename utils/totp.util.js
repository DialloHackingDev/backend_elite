const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

/**
 * Génère un nouveau secret TOTP pour un utilisateur
 * @param {string} email - L'identifiant (ex: ID national) pour l'affichage dans l'app Authenticator
 * @returns {Promise<Object>} - { secret, qrCodeUrl }
 */
const generateSecret = async (identifier) => {
  const secret = speakeasy.generateSecret({
    name: `NaissanceChain (${identifier})`,
    length: 20
  });
  
  // Générer une image QR Code encodée en base64 pour faciliter l'affichage côté frontend
  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
  
  return {
    secret: secret.base32,
    qrCodeUrl
  };
};

/**
 * Vérifie si le code (token) TOTP est valide par rapport au secret
 * @param {string} secret - Le secret base32 stocké pour l'utilisateur
 * @param {string} token - Le code à 6 chiffres saisi par l'utilisateur
 * @returns {boolean} - true si valide, false sinon
 */
const verifyTOTP = (secret, token) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 1 // Autorise un décalage de ±30 secondes (1 window = 30s)
  });
};

module.exports = {
  generateSecret,
  verifyTOTP
};
