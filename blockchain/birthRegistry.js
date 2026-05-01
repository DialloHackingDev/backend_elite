const { ethers } = require('ethers');

const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
// Par défaut, Hardhat Account 0. Si le .env contient un faux "0x...", on l'ignore.
let envKey = process.env.PRIVATE_KEY;
if (envKey && envKey.length !== 66) {
  envKey = null; // Invalide, on fallback sur le défaut
}
const PRIVATE_KEY = envKey || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; 
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Default local

// ABI minimal pour l'inscription d'une naissance
const abi = [
  "function registerBirth(string nationalId, string birthHash) public",
  "function verifyBirth(string nationalId) public view returns (string birthHash, uint256 timestamp, address registrar)"
];

let contractInstance = null;

const getContract = () => {
  if (!contractInstance) {
    const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true });
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    contractInstance = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);
  }
  return contractInstance;
};

/**
 * Enregistre un acte de naissance sur la blockchain
 * @param {string} nationalId - Identifiant GN-AAAA-PREF-XXXX
 * @param {string} hash - Le Hash SHA-256 des données
 * @returns {Promise<string>} - Le hash de la transaction blockchain
 */
const registerBirthOnChain = async (nationalId, hash) => {
  try {
    const contract = getContract();
    
    // Simuler le délai blockchain pour les tests si aucun nœud n'est actif
    if (process.env.NODE_ENV === 'development' && RPC_URL === 'http://127.0.0.1:8545') {
      try {
        await contract.runner.provider.getNetwork();
      } catch(e) {
        console.warn("⚠️ Nœud blockchain injoignable. Simulation de transaction (Mode Dev).");
        return `0xsimulated_tx_hash_${Date.now()}`;
      }
    }

    const tx = await contract.registerBirth(nationalId, hash);
    const receipt = await tx.wait(1); // Attendre 1 confirmation
    return receipt.hash;
  } catch (error) {
    console.error("Erreur Blockchain:", error.message);
    throw new Error("L'inscription sur la blockchain a échoué.");
  }
};

module.exports = {
  registerBirthOnChain,
  getContract
};
