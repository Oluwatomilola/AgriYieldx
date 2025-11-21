require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const agriYield = await ethers.getContractAt("AgriYield", process.env.AGRIYIELD_ADDRESS);
  const farm = await agriYield.farms(1);
  console.log("Farm 1:");
  console.log("  Funding Goal:", ethers.formatUnits(farm.fundingGoal, 6), "HUSDT");
  console.log("  Share Supply:", farm.shareSupply.toString());
  console.log("  Share Price:", ethers.formatUnits(farm.sharePrice, 6), "HUSDT");
  console.log("  Status:", farm.status.toString());
  console.log("  Token:", farm.acceptedToken);
}

main().catch(console.error);
