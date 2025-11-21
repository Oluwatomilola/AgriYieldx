const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🧪 Testing AgriYield Contracts...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  // Contract addresses
  const HUSDT_ADDRESS = process.env.MOCK_USDT_ADDRESS;
  const AGRIYIELD_ADDRESS = process.env.AGRI_YIELD_ADDRESS;
  const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS;
  const FARM_SHARES_ADDRESS = process.env.FARM_SHARES_ADDRESS;

  console.log("\n📋 Contract Addresses:");
  console.log("HUSDT:       ", HUSDT_ADDRESS);
  console.log("AgriYield:   ", AGRIYIELD_ADDRESS);
  console.log("Marketplace: ", MARKETPLACE_ADDRESS);
  console.log("FarmShares:  ", FARM_SHARES_ADDRESS);

  // Load contracts
  const husdt = await ethers.getContractAt("IERC20", HUSDT_ADDRESS);
  const agriYield = await ethers.getContractAt("AgriYield", AGRIYIELD_ADDRESS);
  const marketplace = await ethers.getContractAt("Marketplace", MARKETPLACE_ADDRESS);

  console.log("\n" + "=".repeat(60));
  console.log("TEST 1: Check HUSDT Balance");
  console.log("=".repeat(60));

  const balance = await husdt.balanceOf(deployer.address);
  console.log("✅ Deployer HUSDT balance:", ethers.formatUnits(balance, 6), "HUSDT");

  console.log("\n" + "=".repeat(60));
  console.log("TEST 2: Check Token Association");
  console.log("=".repeat(60));

  try {
    const agriYieldBalance = await husdt.balanceOf(AGRIYIELD_ADDRESS);
    console.log("✅ AgriYield balance:", ethers.formatUnits(agriYieldBalance, 6), "HUSDT");
  } catch (error) {
    console.log("❌ AgriYield balance check failed");
  }

  try {
    const marketplaceBalance = await husdt.balanceOf(MARKETPLACE_ADDRESS);
    console.log("✅ Marketplace balance:", ethers.formatUnits(marketplaceBalance, 6), "HUSDT");
  } catch (error) {
    console.log("❌ Marketplace balance check failed");
  }

  console.log("\n" + "=".repeat(60));
  console.log("TEST 3: Create a Farm");
  console.log("=".repeat(60));

  try {
    // createFarm(uint256 fundingGoal, uint256 shareSupply, uint256 sharePrice, string memory metaCID)
    const fundingGoal = ethers.parseUnits("1000", 6); // 1000 HUSDT
    const shareSupply = 100n; // 100 shares
    const sharePrice = ethers.parseUnits("10", 6); // 10 HUSDT per share

    const createTx = await agriYield.createFarm(
      fundingGoal,
      shareSupply,
      sharePrice,
      "ipfs://QmTest123"
    );
    const receipt = await createTx.wait();
    console.log("✅ Farm created! Hash:", receipt.hash);

    const farmCount = await agriYield.farmCount();
    const farmId = farmCount;
    const farm = await agriYield.getFarm(farmId);
    console.log("   Farm ID:", farmId.toString());
    console.log("   Funding Goal:", ethers.formatUnits(farm.fundingGoal, 6), "HUSDT");
    console.log("   Share Supply:", farm.shareSupply.toString());
    console.log("   Share Price:", ethers.formatUnits(farm.sharePrice, 6), "HUSDT");
  } catch (error) {
    console.log("❌ Farm creation failed:", error.message);
  }

  console.log("\n" + "=".repeat(60));
  console.log("TEST 4: Invest in Farm");
  console.log("=".repeat(60));

  try {
    const farmCount = await agriYield.farmCount();
    const farmId = farmCount;
    const investAmount = ethers.parseUnits("100", 6); // Invest 100 HUSDT (10 shares)

    console.log("   Investing", ethers.formatUnits(investAmount, 6), "HUSDT into farm", farmId.toString());

    // For HTS tokens, we don't need approve - the contract uses HTS.transferToken
    const investTx = await agriYield.invest(farmId, investAmount);
    const receipt = await investTx.wait();
    console.log("✅ Investment successful! Hash:", receipt.hash);

    const farm = await agriYield.getFarm(farmId);
    console.log("   Total Raised:", ethers.formatUnits(farm.raised, 6), "HUSDT");
    console.log("   Status:", farm.status.toString());
  } catch (error) {
    console.log("❌ Investment failed:", error.message);
    console.log("   Full error:", error);
  }

  console.log("\n" + "=".repeat(60));
  console.log("TEST 5: Final Balances");
  console.log("=".repeat(60));

  const deployerBalance = await husdt.balanceOf(deployer.address);
  const agriYieldBalance = await husdt.balanceOf(AGRIYIELD_ADDRESS);

  console.log("✅ Deployer:", ethers.formatUnits(deployerBalance, 6), "HUSDT");
  console.log("✅ AgriYield:", ethers.formatUnits(agriYieldBalance, 6), "HUSDT");

  console.log("\n🎉 ALL TESTS COMPLETE!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
