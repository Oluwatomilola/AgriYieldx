require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging Farm Creation...\n");

  const AGRIYIELD_ADDRESS = process.env.AGRIYIELD_ADDRESS;
  const FARM_SHARES_ADDRESS = process.env.FARM_SHARES_ADDRESS;

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const agriYield = await ethers.getContractAt("AgriYield", AGRIYIELD_ADDRESS);
  const farmShares = await ethers.getContractAt("FarmShares", FARM_SHARES_ADDRESS);

  // Check controller
  try {
    const controller = await farmShares.controller();
    console.log("FarmShares controller:", controller);
    console.log("AgriYield address:   ", AGRIYIELD_ADDRESS);
    console.log("Controller matches:", controller.toLowerCase() === AGRIYIELD_ADDRESS.toLowerCase());
  } catch (error) {
    console.log("Error checking controller:", error.message);
  }

  // Try to create farm with detailed error
  const fundingGoal = ethers.parseUnits("1000", 6);
  const shareSupply = 100n;
  const sharePrice = ethers.parseUnits("10", 6);

  console.log("\nAttempting to create farm...");
  console.log("Funding Goal:", fundingGoal.toString());
  console.log("Share Supply:", shareSupply.toString());
  console.log("Share Price:", sharePrice.toString());
  console.log("Goal == Supply * Price?", fundingGoal === shareSupply * sharePrice);

  const HUSDT_ADDRESS = process.env.MOCK_USDT_ADDRESS;
  console.log("HUSDT Address:", HUSDT_ADDRESS);

  try {
    // Try to estimate gas first to get better error
    const gasEstimate = await agriYield.createFarm.estimateGas(
      fundingGoal,
      shareSupply,
      sharePrice,
      "ipfs://QmTest123",
      HUSDT_ADDRESS
    );
    console.log("Gas estimate:", gasEstimate.toString());

    const tx = await agriYield.createFarm(
      fundingGoal,
      shareSupply,
      sharePrice,
      "ipfs://QmTest123",
      HUSDT_ADDRESS
    );
    const receipt = await tx.wait();
    console.log("✅ Success! Hash:", receipt.hash);
  } catch (error) {
    console.log("\n❌ Error:", error.message);

    if (error.data) {
      console.log("Error data:", error.data);
    }

    // Try to decode the error
    if (error.error && error.error.data) {
      console.log("Raw error data:", error.error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

