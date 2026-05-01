const hre = require("hardhat");

async function main() {
  console.log("Déploiement du contrat BirthRegistry...");

  const BirthRegistry = await hre.ethers.getContractFactory("BirthRegistry");
  const contract = await BirthRegistry.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ BirthRegistry déployé à l'adresse :", address);
  console.log("Réseau :", hre.network.name);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
