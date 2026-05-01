const axios = require('axios');
const FormData = require('form-data');

const PINATA_JWT = process.env.PINATA_JWT; // Alternative à API_KEY/SECRET_API_KEY
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

/**
 * Uploade un fichier (Buffer) sur IPFS via Pinata
 * @param {Buffer} fileBuffer - Le contenu du fichier
 * @param {string} fileName - Le nom du fichier
 * @returns {Promise<string>} - Le CID (Content Identifier) sur IPFS
 */
const uploadToIPFS = async (fileBuffer, fileName) => {
  if (!PINATA_API_KEY && !PINATA_JWT) {
    console.warn("⚠️ IPFS Pinata non configuré. Mode simulation activé.");
    return `QmSimulatedCIDFor${fileName.replace(/[^a-zA-Z0-9]/g, '')}`;
  }

  try {
    const data = new FormData();
    data.append('file', fileBuffer, {
      filename: fileName,
      contentType: 'application/pdf',
    });

    const headers = {
      ...data.getHeaders()
    };

    if (PINATA_JWT) {
      headers['Authorization'] = `Bearer ${PINATA_JWT}`;
    } else {
      headers['pinata_api_key'] = PINATA_API_KEY;
      headers['pinata_secret_api_key'] = PINATA_SECRET_API_KEY;
    }

    const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", data, {
      headers,
      maxBodyLength: "Infinity"
    });

    return res.data.IpfsHash;
  } catch (error) {
    console.error("Erreur lors de l'upload IPFS:", error.response?.data || error.message);
    throw new Error("Impossible de sauvegarder l'acte sur IPFS");
  }
};

module.exports = {
  uploadToIPFS
};
