require("dotenv").config();
const { ethers } = require("hardhat");

// HTS Precompile ABI
const HTS_ABI = [
  "function approve(address token, address spender, uint256 amount) external returns (int64 responseCode)",
  "function cryptoTransfer(tuple(address token, tuple(address accountID, int64 amount)[] transfers, int64[] nftTransfers)[] tokenTransfers) external returns (int64 responseCode)"
];

async function main() {
  console.log("🧪 Testing Full AgriYield Flow...\n");

  const HUSDT_ADDRESS = process.env.MOCK_USDT_ADDRESS;
  const AGRIYIELD_ADDRESS = process.env.AGRI_YIELD_ADDRESS;
  const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS;
  const FARM_SHARES_ADDRESS = process.env.FARM_SHARES_ADDRESS;

  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  console.log("\n📋 Contract Addresses:");
  console.log("HUSDT:       ", HUSDT_ADDRESS);
  console.log("AgriYield:   ", AGRIYIELD_ADDRESS);
  console.log("Marketplace: ", MARKETPLACE_ADDRESS);
  console.log("FarmShares:  ", FARM_SHARES_ADDRESS);

  // Load contracts
  const husdt = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", HUSDT_ADDRESS);
  const agriYield = await ethers.getContractAt("AgriYield", AGRIYIELD_ADDRESS);
  const htsPrecompile = new ethers.Contract("0x0000000000000000000000000000000000000167", HTS_ABI, deployer);

  console.log("\n" + "=".repeat(60));
  console.log("TEST 1: Check Initial HUSDT Balance");
  console.log("=".repeat(60));
  
  const balance = await husdt.balanceOf(deployer.address);
  console.log("✅ Deployer HUSDT balance:", ethers.formatUnits(balance, 6), "HUSDT");

  console.log("\n" + "=".repeat(60));
  console.log("TEST 2: Create a Farm");
  console.log("=".repeat(60));
  
  try {
    const fundingGoal = ethers.parseUnits("1000", 6); // 1000 HUSDT
    const shareSupply = 100n; // 100 shares
    const sharePrice = ethers.parseUnits("10", 6); // 10 HUSDT per share
    
    console.log("   Creating farm with:");
    console.log("   - Funding Goal:", ethers.formatUnits(fundingGoal, 6), "HUSDT");
    console.log("   - Share Supply:", shareSupply.toString());
    console.log("   - Share Price:", ethers.formatUnits(sharePrice, 6), "HUSDT");
    
    const createTx = await agriYield.createFarm(
      fundingGoal,
      shareSupply,
      sharePrice,
      "ipfs://QmTest123CornFarm"
    );
    const receipt = await createTx.wait();
    console.log("✅ Farm created! Hash:", receipt.hash);
    
    const farmCount = await agriYield.farmCount();
    const farmId = farmCount;
    const farm = await agriYield.getFarm(farmId);
    console.log("   Farm ID:", farmId.toString());
    console.log("   Status:", farm.status.toString(), "(0=Active)");
  } catch (error) {
    console.log("❌ Farm creation failed:", error.message);
    return;
  }

  console.log("\n" + "=".repeat(60));
  console.log("TEST 3: Approve AgriYield to Transfer HUSDT");
  console.log("=".repeat(60));

  try {
    const approveAmount = ethers.parseUnits("500", 6); // Approve 500 HUSDT
    console.log("   Approving", ethers.formatUnits(approveAmount, 6), "HUSDT");

    // Try standard ERC20 approve first (HIP-218 redirect)
    const approveTx = await husdt.approve(AGRIYIELD_ADDRESS, approveAmount);
    const approveReceipt = await approveTx.wait();
    console.log("✅ Standard ERC20 approve successful! Hash:", approveReceipt.hash);
  } catch (error) {
    console.log("❌ Standard approve failed:", error.message);
    console.log("   Trying HTS precompile approve...");

    try {
      const approveTx = await htsPrecompile.approve(
        HUSDT_ADDRESS,
        AGRIYIELD_ADDRESS,
        ethers.parseUnits("500", 6)
      );
      await approveTx.wait();
      console.log("✅ HTS precompile approve successful!");
    } catch (err) {
      console.log("❌ HTS precompile approve also failed:", err.message);
      return;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("TEST 4: Invest in Farm (Two-Step Process)");
  console.log("=".repeat(60));

  try {
    const farmCount = await agriYield.farmCount();
    const farmId = farmCount;
    const investAmount = ethers.parseUnits("100", 6); // Invest 100 HUSDT (10 shares)

    console.log("   Step 1: Transfer", ethers.formatUnits(investAmount, 6), "HUSDT using HTS cryptoTransfer");

    // Call HTS precompile's cryptoTransfer directly
    const transferList = [{
      token: HUSDT_ADDRESS,
      transfers: [
        { accountID: deployer.address, amount: -investAmount },
        { accountID: AGRIYIELD_ADDRESS, amount: investAmount }
      ],
      nftTransfers: []
    }];

    const cryptoTransferTx = await htsPrecompile.cryptoTransfer(transferList);
    await cryptoTransferTx.wait();
    console.log("✅ Tokens transferred to contract!");

    console.log("   Step 2: Call invest() to claim shares for farm", farmId.toString());
    const investTx = await agriYield.invest(farmId, investAmount);
    const receipt = await investTx.wait();
    console.log("✅ Investment successful! Hash:", receipt.hash);

    const farm = await agriYield.getFarm(farmId);
    console.log("   Total Raised:", ethers.formatUnits(farm.raised, 6), "HUSDT");
    console.log("   Status:", farm.status.toString());
  } catch (error) {
    console.log("❌ Investment failed:", error.message);
    if (error.data) {
      console.log("   Error data:", error.data);
    }
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

