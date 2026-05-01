const crypto = require('crypto');

/**
 * Génère l'identifiant national unique
 * Format: GN-AAAA-PREF-NNNNNNN (ex: GN-2026-COY-0000001)
 * @param {string} prefecture - Nom de la préfecture (ex: Coyah -> COY)
 * @returns {string}
 */
const generateNationalId = (prefecture) => {
  const year = new Date().getFullYear();
  const prefCode = prefecture.substring(0, 3).toUpperCase();
  // Génère un numéro aléatoire à 7 chiffres. En production, on utiliserait une séquence en base de données.
  const randomNum = Math.floor(1000000 + Math.random() * 9000000); 
  return `GN-${year}-${prefCode}-${randomNum}`;
};

/**
 * Crée un hash SHA-256 déterministe d'un objet JSON
 * @param {Object} payload 
 * @returns {string}
 */
const generatePayloadHash = (payload) => {
  // Tri alphabétique des clés pour assurer le déterminisme
  const ordered = Object.keys(payload).sort().reduce(
    (obj, key) => { 
      obj[key] = payload[key]; 
      return obj;
    }, 
    {}
  );
  
  const jsonString = JSON.stringify(ordered);
  return crypto.createHash('sha256').update(jsonString).digest('hex');
};

module.exports = {
  generateNationalId,
  generatePayloadHash
};
