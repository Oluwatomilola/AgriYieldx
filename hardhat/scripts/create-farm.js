require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const agriYield = await ethers.getContractAt("AgriYield", process.env.AGRIYIELD_ADDRESS);
  const tx = await agriYield.createFarm(
    ethers.parseUnits("1000", 6),
    100n,
    ethers.parseUnits("10", 6),
    "ipfs://QmTest123"
  );
  console.log("TX:", tx.hash);
  await tx.wait();
  console.log("✅ Farm created!");
}

main().catch(console.error);
