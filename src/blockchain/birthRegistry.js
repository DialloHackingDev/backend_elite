const { ethers } = require('ethers');
const http  = require('http');
const https = require('https');

const RPC_URL          = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS   || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

let PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY || PRIVATE_KEY === '0x...' || PRIVATE_KEY.length !== 66) {
  // Compte Hardhat #0 par défaut (dev uniquement)
  PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
}

const ABI = [
  'function registerBirth(string nationalId, string birthHash) public',
  'function verifyBirth(string nationalId) public view returns (string birthHash, uint256 timestamp, address registrar)',
];

/**
 * Teste si le nœud RPC répond via une requête HTTP brute (sans ethers).
 * Évite les connexions persistantes d'ethers qui génèrent des unhandledRejection.
 */
const isNodeReachable = () =>
  new Promise((resolve) => {
    const body   = JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 });
    const url    = new URL(RPC_URL);
    const lib    = url.protocol === 'https:' ? https : http;
    const req    = lib.request(
      { hostname: url.hostname, port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        timeout: 2000 },
      (res) => { resolve(res.statusCode >= 200 && res.statusCode < 500); }
    );
    req.on('error',   () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.write(body);
    req.end();
  });

/**
 * Enregistre un acte sur la blockchain.
 * En dev : si le nœud est absent → hash simulé, jamais de crash.
 * En prod : erreur propagée.
 */
const registerBirthOnChain = async (nationalId, hash) => {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const reachable = await isNodeReachable();
    if (!reachable) {
      console.warn('⚠️  Blockchain indisponible — hash simulé (Mode Dev)');
      return `0xsimulated_${Date.now()}`;
    }
  }

  // Provider jetable : créé et détruit à chaque appel pour éviter les listeners persistants
  let provider = null;
  try {
    provider = new ethers.JsonRpcProvider(RPC_URL, undefined, {
      staticNetwork: true,
      polling:       false,
    });
    const wallet   = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

    const tx      = await contract.registerBirth(nationalId, hash);
    const receipt = await tx.wait(1);
    return receipt.hash;
  } catch (error) {
    if (isDev) {
      console.warn('⚠️  Erreur blockchain — hash simulé:', error.message);
      return `0xsimulated_${Date.now()}`;
    }
    throw new Error("L'inscription sur la blockchain a échoué: " + error.message);
  } finally {
    // Détruire le provider pour couper toutes les connexions persistantes
    if (provider) {
      try { provider.destroy(); } catch (_) {}
    }
  }
};

module.exports = { registerBirthOnChain };
