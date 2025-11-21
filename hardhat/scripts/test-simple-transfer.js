require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing Simple HUSDT Transfer to Contract...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  const HUSDT_ADDRESS = process.env.MOCK_USDT_ADDRESS;
  const AGRIYIELD_ADDRESS = process.env.AGRI_YIELD_ADDRESS;

  console.log("HUSDT:", HUSDT_ADDRESS);
  console.log("AgriYield:", AGRIYIELD_ADDRESS);

  // Create HUSDT contract instance
  const ERC20_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)"
  ];
  
  const husdt = new ethers.Contract(HUSDT_ADDRESS, ERC20_ABI, deployer);

  // Check balances
  const deployerBalance = await husdt.balanceOf(deployer.address);
  const contractBalance = await husdt.balanceOf(AGRIYIELD_ADDRESS);
  
  console.log("\nBefore Transfer:");
  console.log("Deployer balance:", ethers.formatUnits(deployerBalance, 6), "HUSDT");
  console.log("Contract balance:", ethers.formatUnits(contractBalance, 6), "HUSDT");

  // Try to transfer 10 HUSDT to contract
  console.log("\nTransferring 10 HUSDT to AgriYield contract...");
  try {
    const tx = await husdt.transfer(AGRIYIELD_ADDRESS, ethers.parseUnits("10", 6));
    const receipt = await tx.wait();
    console.log("✅ Transfer successful! Hash:", receipt.hash);
  } catch (error) {
    console.log("❌ Transfer failed:", error.message);
    console.log("\nThis means the contract cannot receive HTS tokens via transfer()");
    console.log("Even though it's associated with the token.");
  }

  // Check balances again
  const deployerBalanceAfter = await husdt.balanceOf(deployer.address);
  const contractBalanceAfter = await husdt.balanceOf(AGRIYIELD_ADDRESS);
  
  console.log("\nAfter Transfer:");
  console.log("Deployer balance:", ethers.formatUnits(deployerBalanceAfter, 6), "HUSDT");
  console.log("Contract balance:", ethers.formatUnits(contractBalanceAfter, 6), "HUSDT");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

