require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Testing Working Contract...\n");

  // Working contract addresses from mumin/Agro (from frontend .env)
  const WORKING_AGRIYIELD = "0x49dA1619aA019a9d63d30A89e5fAAf405E32F1F7";
  const HUSDT_ADDRESS = "0x000000000000000000000000000000000069928b";

  const [deployer] = await ethers.getSigners();
  console.log("User address:", deployer.address);

  // ERC20 interface for HUSDT
  const erc20Abi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
  ];
  const husdt = new ethers.Contract(HUSDT_ADDRESS, erc20Abi, deployer);

  // Check balance
  const balance = await husdt.balanceOf(deployer.address);
  console.log("HUSDT Balance:", ethers.formatUnits(balance, 6), "HUSDT");

  // Check allowance for working contract
  const allowance = await husdt.allowance(deployer.address, WORKING_AGRIYIELD);
  console.log("Allowance for working contract:", ethers.formatUnits(allowance, 6), "HUSDT");

  // Approve working contract
  console.log("\nApproving working contract...");
  const approveTx = await husdt.approve(WORKING_AGRIYIELD, ethers.parseUnits("100", 6));
  await approveTx.wait();
  console.log("✅ Approved");

  // Check new allowance
  const newAllowance = await husdt.allowance(deployer.address, WORKING_AGRIYIELD);
  console.log("New allowance:", ethers.formatUnits(newAllowance, 6), "HUSDT");

  // Try to invest in working contract
  const agriYieldAbi = [
    "function investWithHUSDT(uint256 farmId, uint256 amount) external",
    "function farmCount() view returns (uint256)",
    "function farms(uint256) view returns (tuple(address farmer, uint256 fundingGoal, uint256 shareSupply, uint256 sharePrice, uint256 raised, uint8 status, address acceptedToken, string metadataURI, uint256 proceeds))"
  ];
  const workingContract = new ethers.Contract(WORKING_AGRIYIELD, agriYieldAbi, deployer);

  const farmCount = await workingContract.farmCount();
  console.log("\nFarm count in working contract:", farmCount.toString());

  if (farmCount > 0n) {
    // Try to invest without checking farm details
    console.log("\nTrying to invest in working contract...");
    try {
      const investAmount = ethers.parseUnits("10", 6); // 10 HUSDT
      console.log("Estimating gas for investWithHUSDT(1, 10 HUSDT)...");
      const gasEstimate = await workingContract.investWithHUSDT.estimateGas(1, investAmount);
      console.log("Gas estimate:", gasEstimate.toString());
      console.log("✅ Gas estimation succeeded! This means the transaction would work.");

      console.log("\nSending actual transaction...");
      const investTx = await workingContract.investWithHUSDT(1, investAmount);
      console.log("Tx hash:", investTx.hash);
      await investTx.wait();
      console.log("✅ Investment in working contract succeeded!");
    } catch (error) {
      console.log("❌ Investment in working contract failed:", error.message);
      if (error.data) {
        console.log("Error data:", error.data);
      }

      // Try to get the response code from HTS
      console.log("\n🔍 Checking what HTS response code we would get...");
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
          WORKING_AGRIYIELD,
          10000000 // 10 HUSDT
        );
        console.log("HTS transferToken response code:", response.toString());
        console.log("Code 22 = SUCCESS, Code 176 = INVALID_SIGNATURE");
      } catch (htsError) {
        console.log("HTS transferToken test failed:", htsError.message);
      }
    }
  }
}

main().catch(console.error);
