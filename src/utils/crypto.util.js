const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
// Ensure the key is exactly 32 bytes. In production, ENCRYPTION_KEY should be a 64-char hex string (32 bytes).
const DEFAULT_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || DEFAULT_KEY, 'hex'); 
const IV_LENGTH = 16;

/**
 * Encrypts a string using AES-256-GCM
 * @param {string} text - The text to encrypt
 * @returns {string} - The encrypted text in format: iv:authTag:encryptedText
 */
const encrypt = (text) => {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypts a string that was encrypted with AES-256-GCM
 * @param {string} hash - The encrypted string in format: iv:authTag:encryptedText
 * @returns {string} - The original decrypted text
 */
const decrypt = (hash) => {
  if (!hash) return hash;
  const parts = hash.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted text format');
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encryptedText = parts[2];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

module.exports = {
  encrypt,
  decrypt
};
