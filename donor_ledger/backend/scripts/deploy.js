// backend/scripts/deploy.js
const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment...");
  const Contract = await hre.ethers.getContractFactory("OrganRegistry");
  const contract = await Contract.deploy();
  await contract.waitForDeployment();
  console.log("✅ Deployed at:", await contract.getAddress());
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exitCode = 1;
});