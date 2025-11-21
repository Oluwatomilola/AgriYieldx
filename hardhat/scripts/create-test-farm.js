require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  console.log("🌾 Creating Test Farm...\n");

  const AGRIYIELD_ADDRESS = process.env.AGRIYIELD_ADDRESS;
  const HUSDT_ADDRESS = process.env.MOCK_USDT_ADDRESS;

  console.log("AgriYield Address:", AGRIYIELD_ADDRESS);
  console.log("HUSDT Address:", HUSDT_ADDRESS);

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const agriYield = await ethers.getContractAt("AgriYield", AGRIYIELD_ADDRESS);

  // Create farm with HUSDT as accepted token
  const fundingGoal = ethers.parseUnits("1000", 6); // 1000 HUSDT
  const shareSupply = 100n;
  const sharePrice = ethers.parseUnits("10", 6); // 10 HUSDT per share

  console.log("\nCreating farm...");
  console.log("Funding Goal:", fundingGoal.toString(), "(1000 HUSDT)");
  console.log("Share Supply:", shareSupply.toString());
  console.log("Share Price:", sharePrice.toString(), "(10 HUSDT)");
  console.log("Accepted Token:", HUSDT_ADDRESS);

  const tx = await agriYield.createFarm(
    fundingGoal,
    shareSupply,
    sharePrice,
    "ipfs://QmTest123",
    HUSDT_ADDRESS
  );
  
  console.log("Transaction sent:", tx.hash);
  const receipt = await tx.wait();
  console.log("✅ Farm created! Block:", receipt.blockNumber);
  
  // Get farm ID from event
  const event = receipt.logs.find(log => {
    try {
      const parsed = agriYield.interface.parseLog(log);
      return parsed && parsed.name === "FarmCreated";
    } catch {
      return false;
    }
  });
  
  if (event) {
    const parsed = agriYield.interface.parseLog(event);
    console.log("Farm ID:", parsed.args.farmId.toString());
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

