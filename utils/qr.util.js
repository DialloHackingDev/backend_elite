const crypto = require('crypto');
const qrcode = require('qrcode');

const HMAC_SECRET = process.env.ENCRYPTION_KEY || 'default-secret-for-dev'; // Utilisation de la clé AES comme secret HMAC

/**
 * Génère la signature HMAC pour sécuriser l'authenticité des données du QR Code
 * @param {string} nationalId 
 * @param {string} blockchainHash 
 * @returns {string} - Signature hex
 */
const generateHMACSignature = (nationalId, blockchainHash) => {
  const hmac = crypto.createHmac('sha256', HMAC_SECRET);
  hmac.update(`${nationalId}:${blockchainHash}`);
  return hmac.digest('hex').substring(0, 16); // 16 caractères suffisent pour la vérification rapide
};

/**
 * Vérifie si la signature lue dans un QR code correspond aux données
 */
const verifyHMACSignature = (nationalId, blockchainHash, providedSignature) => {
  const expectedSignature = generateHMACSignature(nationalId, blockchainHash);
  return expectedSignature === providedSignature;
};

/**
 * Génère un QR Code DataURL contenant le payload sécurisé
 */
const generateQRCodeDataURL = async (nationalId, blockchainHash) => {
  const signature = generateHMACSignature(nationalId, blockchainHash);
  
  // Format des données encodées dans le QR Code
  const qrPayload = JSON.stringify({
    id: nationalId,
    hash: blockchainHash,
    sig: signature,
    url: `https://naissancechain.gov.gn/verify/${nationalId}` // Lien pour le scanner basique
  });

  return await qrcode.toDataURL(qrPayload);
};

module.exports = {
  generateHMACSignature,
  verifyHMACSignature,
  generateQRCodeDataURL
};
