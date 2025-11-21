require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const husdt = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", process.env.MOCK_USDT_ADDRESS);
  const agriYieldAddress = process.env.AGRIYIELD_ADDRESS;
  
  console.log("Checking if AgriYield can receive HUSDT...");
  console.log("AgriYield:", agriYieldAddress);
  console.log("HUSDT:", process.env.MOCK_USDT_ADDRESS);
  
  // Try to check the balance (if this works, the contract is associated)
  try {
    const balance = await husdt.balanceOf(agriYieldAddress);
    console.log("AgriYield HUSDT balance:", ethers.formatUnits(balance, 6));
    console.log("✅ Contract can hold HUSDT (associated)");
  } catch (e) {
    console.log("❌ Contract cannot hold HUSDT:", e.message);
  }
}

main().catch(console.error);
