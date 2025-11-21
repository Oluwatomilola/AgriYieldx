require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  const HUSDT_ADDRESS = process.env.MOCK_USDT_ADDRESS;
  const AGRIYIELD_ADDRESS = process.env.AGRI_YIELD_ADDRESS;
  
  console.log("Checking allowance...");
  console.log("Owner:", deployer.address);
  console.log("Spender (AgriYield):", AGRIYIELD_ADDRESS);
  console.log("Token:", HUSDT_ADDRESS);
  
  const husdt = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", HUSDT_ADDRESS);
  
  // Check balance
  const balance = await husdt.balanceOf(deployer.address);
  console.log("\nBalance:", ethers.formatUnits(balance, 6), "HUSDT");
  
  // Check allowance
  const allowance = await husdt.allowance(deployer.address, AGRIYIELD_ADDRESS);
  console.log("Allowance:", ethers.formatUnits(allowance, 6), "HUSDT");
  
  // Try to approve
  console.log("\nApproving 1000 HUSDT...");
  const approveTx = await husdt.approve(AGRIYIELD_ADDRESS, ethers.parseUnits("1000", 6));
  await approveTx.wait();
  console.log("Approval tx:", approveTx.hash);
  
  // Check allowance again
  const newAllowance = await husdt.allowance(deployer.address, AGRIYIELD_ADDRESS);
  console.log("New allowance:", ethers.formatUnits(newAllowance, 6), "HUSDT");
  
  // Try a direct transferFrom call
  console.log("\nTrying direct transferFrom call...");
  try {
    const tx = await husdt.transferFrom(deployer.address, AGRIYIELD_ADDRESS, ethers.parseUnits("10", 6));
    await tx.wait();
    console.log("✅ TransferFrom successful!");
  } catch (error) {
    console.log("❌ TransferFrom failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

