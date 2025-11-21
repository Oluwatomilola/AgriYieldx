require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  const husdt = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", process.env.MOCK_USDT_ADDRESS);
  
  console.log("Trying to send 1 HUSDT directly to AgriYield contract...");
  try {
    const tx = await husdt.transfer(process.env.AGRIYIELD_ADDRESS, ethers.parseUnits("1", 6));
    console.log("TX:", tx.hash);
    await tx.wait();
    console.log("✅ Transfer successful!");
    
    const balance = await husdt.balanceOf(process.env.AGRIYIELD_ADDRESS);
    console.log("AgriYield HUSDT balance:", ethers.formatUnits(balance, 6));
  } catch (e) {
    console.log("❌ Transfer failed:", e.message);
  }
}

main().catch(console.error);
