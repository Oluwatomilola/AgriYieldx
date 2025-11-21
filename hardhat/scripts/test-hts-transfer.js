require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Testing HTS Transfer Flow...\n");

  const AGRIYIELD_ADDRESS = process.env.AGRIYIELD_ADDRESS;
  const HUSDT_ADDRESS = process.env.MOCK_USDT_ADDRESS;

  const [deployer] = await ethers.getSigners();
  console.log("User address:", deployer.address);

  // Get contracts
  const agriYield = await ethers.getContractAt("AgriYield", AGRIYIELD_ADDRESS);

  // ERC20 interface for HUSDT
  const erc20Abi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
  ];
  const husdt = new ethers.Contract(HUSDT_ADDRESS, erc20Abi, deployer);

  // Check balance
  console.log("1️⃣ Checking HUSDT balance...");
  const balance = await husdt.balanceOf(deployer.address);
  console.log("Balance:", ethers.formatUnits(balance, 6), "HUSDT");

  if (balance === 0n) {
    console.log("❌ No HUSDT balance. Please claim from faucet first.");
    return;
  }

  // Check current allowance
  console.log("\n2️⃣ Checking current allowance...");
  const currentAllowance = await husdt.allowance(deployer.address, AGRIYIELD_ADDRESS);
  console.log("Current allowance:", ethers.formatUnits(currentAllowance, 6), "HUSDT");

  // Approve
  const approveAmount = ethers.parseUnits("100", 6); // 100 HUSDT
  console.log("\n3️⃣ Approving", ethers.formatUnits(approveAmount, 6), "HUSDT...");

  try {
    const approveTx = await husdt.approve(AGRIYIELD_ADDRESS, approveAmount);
    console.log("Approval tx:", approveTx.hash);
    await approveTx.wait();
    console.log("✅ Approval confirmed");
  } catch (error) {
    console.log("❌ Approval failed:", error.message);
    return;
  }

  // Check new allowance
  console.log("\n4️⃣ Checking new allowance...");
  const newAllowance = await husdt.allowance(deployer.address, AGRIYIELD_ADDRESS);
  console.log("New allowance:", ethers.formatUnits(newAllowance, 6), "HUSDT");

  if (newAllowance < approveAmount) {
    console.log("❌ Allowance not set correctly!");
    return;
  }

  // Check if farm exists
  console.log("\n5️⃣ Checking farm...");
  try {
    const farmCount = await agriYield.farmCount();
    console.log("Farm count:", farmCount.toString());

    if (farmCount === 0n) {
      console.log("❌ No farms exist. Creating one...");

      const fundingGoal = ethers.parseUnits("1000", 6);
      const shareSupply = 100n;
      const sharePrice = ethers.parseUnits("10", 6);

      const createTx = await agriYield.createFarm(
        fundingGoal,
        shareSupply,
        sharePrice,
        "ipfs://QmTest123"
      );
      await createTx.wait();
      console.log("✅ Farm created");
    }

    const farm = await agriYield.farms(1);
    console.log("Farm 1:");
    console.log("  Farmer:", farm.farmer);
    console.log("  Share Price:", ethers.formatUnits(farm.sharePrice, 6), "HUSDT");
    console.log("  Status:", farm.status);
  } catch (error) {
    console.log("❌ Error checking farm:", error.message);
    return;
  }

  // Try to invest
  console.log("\n6️⃣ Attempting to invest...");
  const farm = await agriYield.farms(1);
  const sharePrice = farm.sharePrice;
  console.log("Share price:", ethers.formatUnits(sharePrice, 6), "HUSDT");
  const investAmount = sharePrice; // Invest exactly 1 share

  try {
    // First try to estimate gas
    console.log("Estimating gas...");
    const gasEstimate = await agriYield.invest.estimateGas(1, investAmount);
    console.log("Gas estimate:", gasEstimate.toString());

    console.log("Sending invest transaction...");
    const investTx = await agriYield.invest(1, investAmount);
    console.log("Invest tx:", investTx.hash);
    await investTx.wait();
    console.log("✅ Investment successful!");
  } catch (error) {
    console.log("❌ Investment failed:", error.message);

    // Try to get more details
    if (error.data) {
      console.log("Error data:", error.data);
    }

    // Try calling HTS transferToken directly to see what error we get
    console.log("\n7️⃣ Testing HTS transferToken directly...");
    const htsAbi = [
      "function transferToken(address token, address from, address to, int64 amount) external returns (int)"
    ];
    const hts = new ethers.Contract(
      "0x0000000000000000000000000000000000000167",
      htsAbi,
      deployer
    );

    try {
      const response = await hts.transferToken.staticCall(
        HUSDT_ADDRESS,
        deployer.address,
        AGRIYIELD_ADDRESS,
        Number(investAmount) // Use the same amount as invest
      );
      console.log("HTS response code:", response.toString());

      if (response !== 22n) {
        console.log("❌ HTS transferToken would fail with code:", response.toString());
        console.log("\nCommon Hedera Response Codes:");
        console.log("  22 = SUCCESS");
        console.log("  159 = SPENDER_DOES_NOT_HAVE_ALLOWANCE");
        console.log("  167 = AMOUNT_EXCEEDS_ALLOWANCE");
        console.log("  176 = INVALID_SIGNATURE");
        console.log("  177 = INVALID_ACCOUNT_ID");
      }
    } catch (htsError) {
      console.log("❌ HTS transferToken test failed:", htsError.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

